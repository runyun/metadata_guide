(function () {
  // NOTE: This implementation assumes the following book_statuses exist in database:
  // Workflow: editing → reviewing (inputter submits) → closing (reviewer submits) → closed (approver approves)
  // - 'editing': default initial status (inputter is editing)
  // - 'reviewing': submitted for review (inputter sent to reviewer)
  // - 'closing': submitted to approver (reviewer sent to approver)
  // - 'closed': final approval complete (approver approved)
  
  async function collectFormData() {
    const inputs = document.querySelectorAll('#metadataList input[type="text"]');
    const data = {};
    
    // 先處理 volumes 清單
    const volumesList = document.getElementById('volumesList');
    if (volumesList) {
      const volumeInputs = volumesList.querySelectorAll('input[type="text"]');
      const volumeValues = Array.from(volumeInputs).map(input => input.value || null).filter(val => val !== null && val.trim() !== '');
      if (volumeValues.length > 0) {
        data.volumes = volumeValues.join('&');
      }
    }
    
    // 處理其他輸入框
    inputs.forEach(input => {
      const key = input.id.replace(/Result\d*$/, '').replace(/Page$/, '');
      if (key && key !== 'volumes') {
        const value = input.value || '';
        if (value.trim() !== '') {
          if (input.id.endsWith('Page')) {
            data[key + '_page'] = value;
          } else {
            data[key] = value;
          }
        }
      } 
    });

    // 處理下拉選單
    const selects = document.querySelectorAll('#metadataList select');
    selects.forEach(select => {
      const key = select.id.replace(/Place$/, '');
      if (key && select.value) {
        data[key + '_place'] = select.value;
      }
    });
    
    return data;
  }

  async function reloadCurrentRecord() {
    let metaId = sessionStorage.getItem('currentMetaId') || new URLSearchParams(window.location.search).get('metaId');
    if (!metaId) {
      const bookEntryId = sessionStorage.getItem('currentBookEntryId');
      if (bookEntryId) {
        try {
          const { data, error } = await window.supabaseClient
            .from('book_entries')
            .select('book_id')
            .eq('id', bookEntryId)
            .single();
          if (!error && data && data.book_id) {
            metaId = data.book_id;
            sessionStorage.setItem('currentMetaId', metaId);
          }
        } catch (e) {
          console.error('Unable to resolve metaId from bookEntryId:', e);
        }
      }
    }

    if (!metaId) return;
    // Force reload with metaId param to behave like opened from list
    window.location.href = 'index.html?metaId=' + metaId;
  }

  async function submitMetadata() {
    const titleInput = document.getElementById('titleResult');
    if (!titleInput) return alert('找不到「譜名」欄位');

    const title = (titleInput.value || '').trim();
    if (!title) return alert('「譜名」不可為空');

    const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
    if (!user) {
      alert('請先登入');
      location.href = 'index.html';
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const resultSpan = document.getElementById('submitResult');
    submitBtn.disabled = true;
    resultSpan.textContent = '';

    try {
      const payload = await collectFormData();
      
      // Check user role to determine action
      const userRoles = (user.roles || []).map(r => r.name);
      
      if (userRoles.includes('inputter')) {
        // For inputter: create metadata, book_entries, and record submission in book_approvals
        await submitForApproval(user, payload, resultSpan);
      } else if (userRoles.includes('reviewer')) {
        // For reviewer: update status to 'closing' and record in book_approvals
        await submitToApprover(user, resultSpan);
      } else if (userRoles.includes('approver')) {
        // For approver: update status to 'closed' and record in book_approvals
        await closureApproval(user, resultSpan);
      } else {
        // For other roles: simple metadata insert
        const { data, error } = await window.supabaseClient
          .from('metadata')
          .insert([{ data: payload }]);

        if (error) throw error;

        resultSpan.style.color = 'green';
        resultSpan.textContent = '已成功送出';

        // clear inputs after successful submit
        if (typeof clearAll === 'function') clearAll();
      }

    } catch (err) {
      resultSpan.style.color = 'crimson';
      resultSpan.textContent = '送出失敗：' + (err.message || err);
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      setTimeout(() => { if (resultSpan) resultSpan.textContent = '' }, 4000);
    }
  }

  async function submitForApproval(user, payload, resultSpan) {
    // Determine if we're updating existing metadata (editing) or creating new.
    let metaId = sessionStorage.getItem('currentMetaId') || new URLSearchParams(window.location.search).get('metaId');
    const rawBookEntryId = sessionStorage.getItem('currentBookEntryId') || new URLSearchParams(window.location.search).get('entryId');
    let bookEntryId = (rawBookEntryId && rawBookEntryId !== 'null' && rawBookEntryId !== 'undefined') ? rawBookEntryId : null;

    // If we know the bookEntryId but not metaId, resolve the metaId from book_entries
    if (!metaId && bookEntryId) {
      try {
        const { data: entryData, error: entryErr } = await window.supabaseClient
          .from('book_entries')
          .select('book_id')
          .eq('id', bookEntryId)
          .single();
        if (!entryErr && entryData && entryData.book_id) {
          metaId = entryData.book_id;
          sessionStorage.setItem('currentMetaId', metaId);
        }
      } catch (e) {
        console.error('Unable to resolve metaId from bookEntryId:', e);
      }
    }

    // If we have an existing metadata record, just update it (no insert)
    if (metaId) {
      const { error: updateErr } = await window.supabaseClient
        .from('metadata')
        .update({ data: payload })
        .eq('id', metaId);
      if (updateErr) throw updateErr;
    } else {
      // Create new metadata record
      const {
        data: metaRows,
        error: metaErr
      } = await window.supabaseClient
        .from('metadata')
        .insert([{ data: payload }])
        .select();

      if (metaErr) throw metaErr;
      metaId = metaRows && metaRows[0] && metaRows[0].id;
      if (!metaId) throw new Error('無法取得 metadata id');
    }

    // Ensure we have a book_entries record for this metadata.
    // If bookEntryId is not provided, create a new one.
    if (!bookEntryId) {
      // Create book_entries record
      const entryObj = {
        added_by: user.id,
        book_id: metaId,
        status_code: 'reviewing', // Status indicating submitted for review
        current_role_id: null // Will be set by reviewer
      };

      // attach organization/location if available from user affiliations
      if (user.affiliations && user.affiliations.length > 0) {
        const aff = user.affiliations[0];
        if (aff.organization && aff.organization.id) {
          entryObj.organization_id = aff.organization.id;
        }
        if (aff.location && aff.location.id) {
          entryObj.location_id = aff.location.id;
        }
      }

      const {
        data: entryRows,
        error: entryErr
      } = await window.supabaseClient
        .from('book_entries')
        .insert([entryObj])
        .select();

      if (entryErr) throw entryErr;
      bookEntryId = entryRows && entryRows[0] && entryRows[0].id;
      if (!bookEntryId) throw new Error('無法取得 book_entries id');
    }

    // Ensure current ids are stored for later reload
    sessionStorage.setItem('currentMetaId', metaId);
    sessionStorage.setItem('currentBookEntryId', bookEntryId);

    // Step 3: Get inputter role_id to record in book_approvals
    const inputterRole = user.roles && user.roles.find(r => r.name === 'inputter');
    if (!inputterRole || !inputterRole.id) throw new Error('無法取得 inputter 角色資訊');

    // Step 4: Record submission in book_approvals
    // The action here represents that inputter has submitted (can be considered as 'submitted' state)
    // We use 'approve' action to indicate inputter has approved their own input
    const {
      error: approvalErr
    } = await window.supabaseClient
      .from('book_approvals')
      .insert([{
        book_entry_id: bookEntryId,
        role_id: inputterRole.id,
        approved_by: user.id,
        action: 'approve', // Inputter approves their own input before submission
        comment: '已提交審核',
        acted_at: new Date().toISOString()
      }]);

    if (approvalErr) throw approvalErr;

    // Step 5: Save form to localStorage for reference (optional)
    try {
      const stored = JSON.parse(localStorage.getItem('guideData') || '{}');
      Object.assign(stored, payload);
      localStorage.setItem('guideData', JSON.stringify(stored));
    } catch (e) {
      // ignore localStorage errors
    }

    resultSpan.style.color = 'green';
    resultSpan.textContent = '已成功送出審核，等待審核者審查';

    // keep current record context and reload like from list
    sessionStorage.setItem('currentMetaId', metaId);
    sessionStorage.setItem('currentBookEntryId', bookEntryId);
    reloadCurrentRecord();
  }

  async function submitToApprover(user, resultSpan) {
    // Reviewer submits record to Approver (送結案)
    // This requires a book_entry_id to be available
    // Can be passed via sessionStorage or URL parameter
    
    const bookEntryId = parseInt(
      sessionStorage.getItem('currentBookEntryId') || 
      new URLSearchParams(window.location.search).get('entryId') || 
      '0'
    );
    
    if (!bookEntryId || bookEntryId === 0) {
      throw new Error('未找到要提交的記錄，請先選擇一個記錄');
    }

    // Get reviewer role_id
    const reviewerRole = user.roles && user.roles.find(r => r.name === 'reviewer');
    if (!reviewerRole || !reviewerRole.id) throw new Error('無法取得 reviewer 角色資訊');

    // Step 1: Update book_entries status to 'closing'
    const {
      error: updateErr
    } = await window.supabaseClient
      .from('book_entries')
      .update({ 
        status_code: 'closing',
        current_role_id: null // Will be set by approver
      })
      .eq('id', bookEntryId);

    if (updateErr) throw updateErr;

    // Step 2: Record submission in book_approvals with 'approve' action
    const {
      error: approvalErr
    } = await window.supabaseClient
      .from('book_approvals')
      .insert([{
        book_entry_id: bookEntryId,
        role_id: reviewerRole.id,
        approved_by: user.id,
        action: 'approve', // Reviewer approves and submits to approver
        comment: '已審核，提交結案',
        acted_at: new Date().toISOString()
      }]);

    if (approvalErr) throw approvalErr;

    resultSpan.style.color = 'green';
    resultSpan.textContent = '已送出結案，等待批准者確認';

    // Keep current context and reload as if opened from list
    sessionStorage.setItem('currentBookEntryId', bookEntryId);
    reloadCurrentRecord();
  }

  async function closureApproval(user, resultSpan) {
    // Approver completes the approval (結案)
    // This requires a book_entry_id to be available
    
    const bookEntryId = parseInt(
      sessionStorage.getItem('currentBookEntryId') || 
      new URLSearchParams(window.location.search).get('entryId') || 
      '0'
    );
    
    if (!bookEntryId || bookEntryId === 0) {
      throw new Error('未找到要結案的記錄，請先選擇一個記錄');
    }

    // Get approver role_id
    const approverRole = user.roles && user.roles.find(r => r.name === 'approver');
    if (!approverRole || !approverRole.id) throw new Error('無法取得 approver 角色資訊');

    // Step 1: Update book_entries status to 'closed'
    const {
      error: updateErr
    } = await window.supabaseClient
      .from('book_entries')
      .update({ 
        status_code: 'closed',
        current_role_id: null
      })
      .eq('id', bookEntryId);

    if (updateErr) throw updateErr;

    // Step 2: Record approval in book_approvals with 'approve' action
    const {
      error: approvalErr
    } = await window.supabaseClient
      .from('book_approvals')
      .insert([{
        book_entry_id: bookEntryId,
        role_id: approverRole.id,
        approved_by: user.id,
        action: 'approve', // Approver gives final approval
        comment: '已結案',
        acted_at: new Date().toISOString()
      }]);

    if (approvalErr) throw approvalErr;

    resultSpan.style.color = 'green';
    resultSpan.textContent = '已結案，記錄已完成';

    // Keep current context and reload as if opened from list
    sessionStorage.setItem('currentBookEntryId', bookEntryId);
    reloadCurrentRecord();
  }

  async function deleteRecord() {
    // Delete record that is in editing status and was added by current user
    // Only if not yet in book_approvals
    
    const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
    if (!user) {
      alert('請先登入');
      location.href = 'index.html';
      return;
    }

    const bookEntryId = parseInt(sessionStorage.getItem('currentBookEntryId') || '0');
    if (!bookEntryId) {
      alert('未找到要刪除的記錄');
      return;
    }

    const deleteBtn = document.getElementById('deleteBtn');
    const resultSpan = document.getElementById('submitResult');
    if (deleteBtn) deleteBtn.disabled = true;
    if (resultSpan) resultSpan.textContent = '';

    try {
      // Get the book_id first
      const { data: entryData, error: entryError } = await window.supabaseClient
        .from('book_entries')
        .select('book_id')
        .eq('id', bookEntryId)
        .single();

      if (entryError) throw entryError;
      const bookId = entryData.book_id;

      // Delete from book_entries
      const { error: deleteEntryError } = await window.supabaseClient
        .from('book_entries')
        .delete()
        .eq('id', bookEntryId);

      if (deleteEntryError) throw deleteEntryError;

      // Delete from metadata
      const { error: deleteMetaError } = await window.supabaseClient
        .from('metadata')
        .delete()
        .eq('id', bookId);

      if (deleteMetaError) throw deleteMetaError;

      if (resultSpan) {
        resultSpan.style.color = 'green';
        resultSpan.textContent = '記錄已成功刪除';
      }

      // Clear all form data
      if (typeof clearAll === 'function') {
        clearAll();
      }

      // Clear session storage
      sessionStorage.removeItem('currentBookEntryId');

    } catch (err) {
      if (resultSpan) {
        resultSpan.style.color = 'crimson';
        resultSpan.textContent = '刪除失敗：' + (err.message || err);
      }
      console.error(err);
    } finally {
      if (deleteBtn) deleteBtn.disabled = false;
      if (resultSpan) setTimeout(() => { if (resultSpan) resultSpan.textContent = '' }, 4000);
    }
  }

  function setupSubmitHandlers() {
    // attach to whatever controls currently exist
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.removeEventListener('click', submitMetadata);
      submitBtn.addEventListener('click', submitMetadata);
    }
    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) {
      returnBtn.removeEventListener('click', returnMetadata);
      returnBtn.addEventListener('click', returnMetadata);
    }
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.removeEventListener('click', saveMetadata);
      saveBtn.addEventListener('click', saveMetadata);
    }
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
      deleteBtn.removeEventListener('click', deleteRecord);
      deleteBtn.addEventListener('click', deleteRecord);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupSubmitHandlers();

    // if user logs in/out, clear messages
    window.onUserLogin = function(user) {
      const resultSpan = document.getElementById('submitResult');
      if (resultSpan) resultSpan.textContent = '';
      // reattach handlers since buttons may have been rebuilt
      setupSubmitHandlers();
    };
  });

  // expose helpers so other scripts can call or override if needed
  window.submitMetadata = submitMetadata;
  
  async function returnToPrevious() {
    // Return record to previous role (退回)
    // Reviewer returns to Inputter, Approver returns to Reviewer
    
    const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
    if (!user) {
      alert('請先登入');
      location.href = 'index.html';
      return;
    }

    const bookEntryId = parseInt(
      sessionStorage.getItem('currentBookEntryId') || 
      new URLSearchParams(window.location.search).get('entryId') || 
      '0'
    );
    
    if (!bookEntryId || bookEntryId === 0) {
      alert('未找到要退回的記錄');
      return;
    }

    const returnReason = prompt('請輸入退回原因');
    if (returnReason === null) {
      return; // User cancelled
    }

    const resultSpan = document.getElementById('submitResult');
    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) returnBtn.disabled = true;
    if (resultSpan) resultSpan.textContent = '';

    try {
      const userRoles = (user.roles || []).map(r => r.name);
      let previousStatus = null;
      let roleName = null;

      if (userRoles.includes('reviewer')) {
        // Reviewer returns to inputter (back to 'reviewing' status)
        previousStatus = 'editing';
        roleName = 'reviewer';
      } else if (userRoles.includes('approver')) {
        // Approver returns to reviewer (back to 'closing' status)
        previousStatus = 'reviewing';
        roleName = 'approver';
      } else {
        throw new Error('只有 reviewer 和 approver 可以退回記錄');
      }

      // Get user's role_id
      const userRole = user.roles && user.roles.find(r => r.name === roleName);
      if (!userRole || !userRole.id) throw new Error('無法取得角色資訊');

      // Step 1: Update book_entries status back to previous state
      const {
        error: updateErr
      } = await window.supabaseClient
        .from('book_entries')
        .update({ 
          status_code: previousStatus
        })
        .eq('id', bookEntryId);

      if (updateErr) throw updateErr;

      // Step 2: Record rejection in book_approvals with 'reject' action
      const {
        error: approvalErr
      } = await window.supabaseClient
        .from('book_approvals')
        .insert([{
          book_entry_id: bookEntryId,
          role_id: userRole.id,
          approved_by: user.id,
          action: 'reject', // Reject the current submission
          comment: '退回原因：' + returnReason,
          acted_at: new Date().toISOString()
        }]);

      if (approvalErr) throw approvalErr;

      if (resultSpan) {
        resultSpan.style.color = 'green';
        resultSpan.textContent = '已退回上一個步驟';
      }

      // Keep current context and reload as if opened from list
      sessionStorage.setItem('currentBookEntryId', bookEntryId);
      reloadCurrentRecord();
    } catch (err) {
      if (resultSpan) {
        resultSpan.style.color = 'crimson';
        resultSpan.textContent = '退回失敗：' + (err.message || err);
      }
      console.error(err);
    } finally {
      if (returnBtn) returnBtn.disabled = false;
      if (resultSpan) setTimeout(() => { if (resultSpan) resultSpan.textContent = '' }, 4000);
    }
  }

  window.returnMetadata = returnToPrevious;
  async function saveMetadata() {
    // similar validation as submitMetadata, but also create a book_entries row
    const titleInput = document.getElementById('titleResult');
    if (!titleInput) return alert('找不到「譜名」欄位');

    const title = (titleInput.value || '').trim();
    if (!title) return alert('「譜名」不可為空');

    const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
    if (!user) {
      alert('請先登入');
      location.href = 'index.html';
      return;
    }

    const saveBtn = document.getElementById('saveBtn');
    const resultSpan = document.getElementById('submitResult');
    if (saveBtn) saveBtn.disabled = true;
    if (resultSpan) resultSpan.textContent = '';

    try {
      const payload = await collectFormData();

      // Determine whether we are editing an existing record
      let metaId = sessionStorage.getItem('currentMetaId') || new URLSearchParams(window.location.search).get('metaId');
      const bookEntryId = sessionStorage.getItem('currentBookEntryId') || new URLSearchParams(window.location.search).get('entryId');

      // If we don't have metaId yet but have bookEntryId, resolve it
      if (!metaId && bookEntryId) {
        try {
          const { data: entryData, error: entryErr } = await window.supabaseClient
            .from('book_entries')
            .select('book_id')
            .eq('id', bookEntryId)
            .single();
          if (!entryErr && entryData && entryData.book_id) {
            metaId = entryData.book_id;
            sessionStorage.setItem('currentMetaId', metaId);
          }
        } catch (e) {
          console.error('Unable to resolve metaId from bookEntryId:', e);
        }
      }

      let isEditing = false;
      if (bookEntryId) {
        try {
          const { data: entryData, error: entryErr } = await window.supabaseClient
            .from('book_entries')
            .select('status_code')
            .eq('id', bookEntryId)
            .single();
          if (!entryErr && entryData && entryData.status_code === 'editing') {
            isEditing = true;
          }
        } catch (e) {
          console.error('Unable to verify editing status:', e);
        }
      }

      // If we are editing an existing record, update metadata instead of inserting
      if (isEditing && metaId) {
        const { error: updateErr } = await window.supabaseClient
          .from('metadata')
          .update({ data: payload })
          .eq('id', metaId);
        if (updateErr) throw updateErr;

        if (resultSpan) {
          resultSpan.style.color = 'green';
          resultSpan.textContent = '已成功更新表單（編輯狀態）';
        }

        return;
      }

      // insert into metadata table first and grab its id
      const {
        data: metaRows,
        error: metaErr
      } = await window.supabaseClient
        .from('metadata')
        .insert([{ data: payload }])
        .select();

      if (metaErr) throw metaErr;
      const newMetaId = metaRows && metaRows[0] && metaRows[0].id;
      if (!newMetaId) throw new Error('無法取得 metadata id');

      // prepare book_entries record
      const entryObj = {
        added_by: user.id,
        book_id: newMetaId
      };

      // attach organization/location if available from user affiliations
      if (user.affiliations && user.affiliations.length > 0) {
        const aff = user.affiliations[0];
        if (aff.organization && aff.organization.id) {
          entryObj.organization_id = aff.organization.id;
        }
        if (aff.location && aff.location.id) {
          entryObj.location_id = aff.location.id;
        }
      }

      const {
        data: entryRows,
        error: entryErr
      } = await window.supabaseClient
        .from('book_entries')
        .insert([entryObj]);

      if (entryErr) throw entryErr;

      // optional: also save current form to localStorage so user can continue later
      try {
        const stored = JSON.parse(localStorage.getItem('guideData') || '{}');
        Object.assign(stored, payload);
        localStorage.setItem('guideData', JSON.stringify(stored));
      } catch (e) {
        // ignore localStorage errors
      }

      if (resultSpan) {
        resultSpan.style.color = 'green';
        resultSpan.textContent = '已成功儲存';
      }

    } catch (err) {
      if (resultSpan) {
        resultSpan.style.color = 'crimson';
        resultSpan.textContent = '儲存失敗：' + (err.message || err);
      }
      console.error(err);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (resultSpan) setTimeout(() => { if (resultSpan) resultSpan.textContent = '' }, 4000);
    }
  }

  window.saveMetadata = saveMetadata;
  window.deleteRecord = deleteRecord;
  window.setupSubmitHandlers = setupSubmitHandlers;

})();

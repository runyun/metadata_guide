const data = {
    "columns" : [
        { "name": "title",
          "display": "譜名",
          "explain": "家譜的書名",
          "placeIndexes": [0, 1],
          "hasGuide": true }
        ,{ "name": "subtitle",
          "display": "副譜名",
          "explain": "對譜名的補充說明，用來交代範圍、版本、或修纂情況，增加辨識度",
          "rules": [
            "若無副譜名則留空"
            , "多個副譜名之間用「.」號隔開"
            , "若有超過兩個姓氏要加「多種姓氏」"],
          "placeIndexes": [0, 1, 2, 3],
          "hasGuide": true }
        ,{ "name": "surname",
          "display": "姓氏",
          "explain": "家譜裡包含什麼姓氏的世系？",
          "rules": [
            "最多記載兩個姓氏"
            , "若超過兩個姓氏只錄最主要的那1個，並在副譜名加「多種姓氏」"],
          "placeIndexes": [0, 1, 4],
          "hasGuide": true }
        ,{ "name": "total_number",
          "display": "總卷數",
          "explain": "家譜的所有本數和使用單位",
          "placeIndexes": [2, 10],
          "hasGuide": true }
        ,{ "name": "ancestral_hall",
          "display": "堂號",
          "explain": "用於識別、區分不同支系或發源地的特殊徽號",
          "rules": ["只記一個，如有多個就記第1個"],
          "placeIndexes": [0, 1, 4, 11],
          "hasGuide": true }
        ,{ "name": "author",
          "display": "作者",
          "explain": "主要編輯者",
          "rules": [
            "填寫時需連名帶姓"
            , "只填寫一個人就好"
            , "如果沒有的話就留空"
            , "編輯稱號優先順序:主修>主編>纂修>總編>編修>責任編輯"
            ],
          "placeIndexes": [0, 3, 5, 9], 
          "hasGuide": true }
        ,{ "name": "first_ancestor",
          "display": "一世祖",
          "explain": "世系圖上的第一代祖先", 
          "rules": [
            "填寫時需連名帶姓"
            , "填寫諱名"
            , "只填寫一個人就好"],
          "placeIndexes": [3, 7, 8], 
          "hasGuide": true }
        ,{ "name": "migrant_ancestor",
          "display": "始遷祖",
          "explain": "一世祖之後遷徒的祖先",
          "rules": [
            "填寫時需連名帶姓"
            , "填寫諱名"
            , "只填寫一個人就好"
            , "若是和一世祖同一人則留空"],
          "placeIndexes": [3, 7, 8],
          "hasGuide": true }
        ,{ "name": "place",
          "display": "譜籍地",
          "explain": "一世祖或始遷祖遷到的現代地名",
          "placeIndexes": [3, 8],
          "hasGuide": true }
        ,{ "name": "beg_year",
          "display": "起年",
          "explain": "家譜所記載的最早祖先的西元年",
          "rules": [
            "西元年前的用負數表示"
            , "若是年代比黃帝更早的話一律填「-2704」"
            ,"若找不到任何起年資訊請填「1」"],
          "placeIndexes": [8], 
          "hasGuide": true }
        ,{ "name": "publish_year",
          "display": "出版年",
          "explain": "家譜出版的西元年",
          "placeIndexes": [3, 4, 5, 6],
          "hasGuide": true }
        ,{ "name": "volumes",
          "display": "卷冊內容",
          "explain": "若是這套家譜本數多於一本，各本的內容主題", 
          "placeIndexes": [1, 2],
          "hasGuide": true }
        ,{ "name": "donor",
          "display": "捐贈者",
          "explain": "贈送這本譜書的人的姓名", 
          "placeIndexes": [0],
          "hasGuide": false }
        ,{ "name": "donor_contact",
          "display": "捐贈者聯絡方式",
          "explain": "捐贈者的聯絡方式，可能是電話、地址、社群網站…", 
          "placeIndexes": [0],
          "hasGuide": false }
        ,{ "name": "memo",
          "display": "備註",
          "explain": "譜書需要特別注意的事情，比如:缺幾本、泡過水、有幾頁毀損…等", 
          "placeIndexes": [0],
          "hasGuide": false }
    ]
};
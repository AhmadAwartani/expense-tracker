// All the texts of the page in English (en) and Arabic (ar).
// In index.html every text has data-i18n="key", and app.js puts the text of the chosen language.
// If you want to add a text: write the same key in both languages.

const translations = {
  en: {
    app_name: "Expense Tracker",
    languages_label: "Languages",
    theme_dark: "Dark mode",
    theme_light: "Light mode",

    total_amount: "Total amount",
    expense_count: "Number of expenses",
    highest_expense: "Highest expense",

    add_title: "Add a new expense",
    label_title: "Title",
    placeholder_title: "For example: Lunch",
    label_amount: "Amount",
    placeholder_amount: "0.00",
    label_category: "Category",
    choose_category: "Choose a category",
    label_other_category: "Other category",
    placeholder_other_category: "For example: Shopping",
    label_date: "Date",
    btn_add: "Add expense",

    table_title: "My expenses",
    filter_label: "Filter by category",
    all: "All",
    th_title: "Title",
    th_amount: "Amount",
    th_category: "Category",
    th_date: "Date",
    th_actions: "Actions",
    btn_edit: "Edit",
    btn_delete: "Delete",
    no_expenses: "There are no expenses to show.",

    cat_Food: "Food",
    cat_Transport: "Transport",
    cat_Bills: "Bills",
    cat_Entertainment: "Entertainment",
    cat_Other: "Other",
    cat_Clothes: "Clothes",

    edit_title: "Edit expense",
    btn_save: "Save changes",
    btn_cancel: "Cancel",
    loading: "Loading...",

    msg_added: "The expense was added.",
    msg_updated: "The expense was updated.",
    msg_deleted: "The expense was deleted.",
    confirm_delete: "Are you sure you want to delete this expense?",

    err_server_off: "Cannot connect to the server. Make sure the backend is running, then try again.",
    err_server: "Something went wrong in the server. Please try again.",

    err_title_required: "Title is required.",
    err_title_long: "Title must be 100 characters or less.",
    err_amount_required: "Amount is required and it must be a number.",
    err_amount_positive: "Amount must be greater than 0.",
    err_amount_big: "Amount is too big. The maximum is 99999999.99",
    err_amount_decimals: "Amount can have at most 2 decimal places.",
    err_category_required: "Please choose a category.",    
    err_other_category_required: "Please type a name for the new category.",
    err_other_category_long: "The new category name must be 20 characters or less.",
    err_date_required: "Please choose a valid date.",

    footer_text: "Expense Tracker - a project for Dalil Training Academy",   
    footer_text2: "Ahmad Zeyad Awartani"
  },

  ar: {
    app_name: "متتبع المصاريف",
    languages_label: "اللغات",
    theme_dark: "الوضع الداكن",
    theme_light: "الوضع الفاتح",

    total_amount: "إجمالي المبلغ",
    expense_count: "عدد المصاريف",
    highest_expense: "أعلى مصروف",

    add_title: "إضافة مصروف جديد",
    label_title: "العنوان",
    placeholder_title: "مثال: غداء",
    label_amount: "المبلغ",
    placeholder_amount: "0.00",
    label_category: "الفئة",
    choose_category: "اختر الفئة",
    label_other_category: "فئة أخرى",
    placeholder_other_category: "مثال: تسوق",
    label_date: "التاريخ",
    btn_add: "إضافة المصروف",

    table_title: "مصاريفي",
    filter_label: "تصفية حسب الفئة",
    all: "الكل",
    th_title: "العنوان",
    th_amount: "المبلغ",
    th_category: "الفئة",
    th_date: "التاريخ",
    th_actions: "الإجراءات",
    btn_edit: "تعديل",
    btn_delete: "حذف",
    no_expenses: "لا توجد مصاريف لعرضها.",

    cat_Food: "طعام",
    cat_Transport: "مواصلات",
    cat_Bills: "فواتير",
    cat_Entertainment: "ترفيه",
    cat_Other: "أخرى",
    cat_Clothes: "ملابس",

    edit_title: "تعديل المصروف",
    btn_save: "حفظ التعديلات",
    btn_cancel: "إلغاء",
    loading: "جاري التحميل...",

    msg_added: "تمت إضافة المصروف.",
    msg_updated: "تم تعديل المصروف.",
    msg_deleted: "تم حذف المصروف.",
    confirm_delete: "هل أنت متأكد أنك تريد حذف هذا المصروف؟",

    err_server_off: "لا يمكن الاتصال بالخادم. تأكد أن الـ Backend يعمل ثم حاول مرة أخرى.",
    err_server: "حدث خطأ في الخادم. حاول مرة أخرى.",

    err_title_required: "العنوان مطلوب.",
    err_title_long: "يجب ألا يزيد العنوان عن 100 حرف.",
    err_amount_required: "المبلغ مطلوب ويجب أن يكون رقمًا.",
    err_amount_positive: "يجب أن يكون المبلغ أكبر من صفر.",
    err_amount_big: "المبلغ كبير جدًا. الحد الأقصى هو 99999999.99",
    err_amount_decimals: "يجب ألا يزيد المبلغ عن خانتين عشريتين.",
    err_category_required: "الرجاء اختيار الفئة.",
    err_other_category_required: "الرجاء كتابة اسم للفئة الجديدة.",
    err_other_category_long: "يجب ألا يزيد اسم الفئة الجديدة عن 20 حرفًا.",
    err_date_required: "الرجاء اختيار تاريخ صحيح.",

    footer_text: "متتبع المصاريف - مشروع لأكاديمية دليل للتدريب",
    footer_text2: "أحمد زياد عورتاني"
  }
};

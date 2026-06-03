(function () {
  const STORAGE_KEY = "driverClosingTracker.v1";
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const WEEKLY_RENT_TARGET = 390;
  const MONTHLY_MORTGAGE_TARGET = 4000;
  const SEEDED_NOTE_VERSION = "manual-notes-2026-06-03-supabase-fix";
  const LANGUAGE_KEY = "driverClosingTracker.language";
  const SUPABASE_CONFIG = window.DRIVER_TRACKER_SUPABASE_CONFIG || {};
  const SUPABASE_SYNC_DELAY = 700;
  const USERNAME_EMAIL_MAP = {
    isaac: "keowei1992@gmail.com"
  };

  const fields = [
    "date", "startTime", "endTime", "secondStartTime", "secondEndTime",
    "platformMode", "jobs", "grabWallet",
    "grabCash", "grabTng", "grabRefund", "boltWallet", "boltCash", "boltTng",
    "totalCashCollected", "totalTngCollected", "extraBonus", "extraCost", "extraNotes",
    "petrolCost", "tngCost", "insuranceCost", "otherCost", "notes",
    "tngEwalletStart", "tngEwalletEnd", "tngCardStart", "tngCardEnd",
    "grabCashWalletStart", "grabCashWalletEnd", "grabCreditWalletStart",
    "grabCreditWalletEnd", "boltWalletStart", "boltWalletEnd"
  ];

  const moneyFields = [
    "grabWallet", "grabCash", "grabTng", "grabRefund", "boltWallet", "boltCash",
    "boltTng", "totalCashCollected", "totalTngCollected", "extraBonus", "extraCost",
    "petrolCost", "tngCost", "insuranceCost", "otherCost",
    "tngEwalletStart", "tngEwalletEnd", "tngCardStart", "tngCardEnd",
    "grabCashWalletStart", "grabCashWalletEnd", "grabCreditWalletStart",
    "grabCreditWalletEnd", "boltWalletStart", "boltWalletEnd"
  ];
  const balanceFields = [
    "tngEwalletStart", "tngEwalletEnd", "tngCardStart", "tngCardEnd",
    "grabCashWalletStart", "grabCashWalletEnd", "grabCreditWalletStart",
    "grabCreditWalletEnd", "boltWalletStart", "boltWalletEnd", "platformMode"
  ];

  const holidays2026 = {
    "2026-01-01": "New Year's Day",
    "2026-02-01": "Federal Territory Day / Thaipusam",
    "2026-02-02": "Observed holiday in many Klang Valley areas",
    "2026-02-17": "Chinese New Year",
    "2026-02-18": "Chinese New Year holiday",
    "2026-03-07": "Nuzul Al-Quran",
    "2026-03-23": "Hari Raya Aidilfitri",
    "2026-03-24": "Hari Raya Aidilfitri holiday",
    "2026-05-01": "Labour Day",
    "2026-05-27": "Hari Raya Aidiladha",
    "2026-05-31": "Wesak Day",
    "2026-06-01": "Birthday of Yang di-Pertuan Agong",
    "2026-08-25": "Prophet Muhammad's Birthday",
    "2026-08-31": "National Day",
    "2026-09-16": "Malaysia Day",
    "2026-11-08": "Deepavali",
    "2026-12-11": "Sultan of Selangor's Birthday",
    "2026-12-25": "Christmas Day"
  };

  const state = emptyState();
  let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "zh";
  let editingId = null;
  let editingMovementId = null;
  let isAutoSaving = false;
  let supabaseClient = null;
  let supabaseUserId = null;
  let syncTimer = null;
  let isSyncing = false;
  let isAppUnlocked = false;

  const copy = {
    zh: {
      appEyebrow: "收入目标",
      titleDaily: "每日目标",
      titleWeek: "本周 Dashboard",
      titleCash: "现金移动",
      titleCompare: "平台比较",
      titleMonth: "月报",
      newRecord: "新一天",
      duplicateYesterday: "复制昨天格式",
      editPast: "编辑旧记录",
      shift: "工作时间",
      date: "日期",
      startTime: "开始时间",
      endTime: "结束时间",
      secondStart: "第二段开始",
      secondEnd: "第二段结束",
      hours: "总工作小时",
      platform: "平台",
      both: "Grab 和 Bolt",
      grabOnly: "只跑 Grab",
      boltOnly: "只跑 Bolt",
      jobs: "单数",
      balanceTitle: "开工 / 收工余额",
      calculateToday: "计算今天",
      balanceHelp: "只输入你看到的余额。如果开工余额空着，系统会用最近一次保存的收工余额来算。",
      startColumn: "开工",
      endColumn: "收工",
      smartTagCard: "Smart Tag 实体卡",
      receivedTitle: "今日收到",
      walletPL: "钱包赚 / 亏",
      cashCollected: "现金收到",
      tngCollected: "TNG E-Wallet 收到",
      totalCashCollected: "现金总数",
      totalTngCollected: "TNG E-Wallet 总数",
      extraBonus: "Extra Bonus",
      extraCost: "Extra Cost",
      extraNotes: "额外备注",
      costs: "成本",
      petrol: "打油",
      tngCost: "SmartTAG Balance",
      insurance: "Grab 保险",
      otherCost: "其他成本",
      notes: "备注",
      todaySummary: "今天总结",
      todaySales: "今天总收入",
      todayNet: "今天净收入",
      todayHourly: "每小时净收入",
      todayCost: "今天总成本",
      costCategory: "成本分类",
      other: "其他",
      delete: "删除",
      saveToday: "暂存",
      endDay: "结束今天",
      weekTitle: "本周",
      weekHelp: "本周净收入、车租目标、房贷目标和目前进度。",
      movementAmount: "金额",
      movementType: "类型",
      saveMovement: "保存移动",
      month: "月份",
      navDay: "记录",
      navWeek: "本周",
      navCash: "现金",
      navCompare: "比较",
      navMonth: "月份",
      noHoliday: "没有公共假期提醒",
      holidayPrefix: "公共假期提醒",
      weeklyTarget: "本周目标",
      stillNeed: "还差",
      completed: "已完成",
      finishWeek: "完成本周目标",
      needPerDay: "每天至少",
      daysLeft: "天剩下",
      commitment: "固定开销",
      rentMortgage: "车租 + 房贷分摊",
      thisWeekSales: "本周总收入",
      thisWeekCost: "本周成本",
      thisWeekNet: "本周净收入",
      thisWeekHours: "本周小时",
      thisWeekJobs: "本周单数",
      netPerHour: "每小时净收入",
      grabWeek: "Grab 本周",
      boltWeek: "Bolt 本周",
      petrolWeek: "本周打油",
      tngWeek: "本周 TNG",
      refund: "Refund",
      noMovement: "还没有现金移动",
      edit: "编辑",
      totalSales: "总收入",
      totalNetIncome: "总净收入",
      totalJobs: "总单数",
      totalHours: "总小时",
      avgHour: "平均每小时",
      avgJob: "平均每单",
      bestDay: "最好的一天",
      bestRange: "最好时间段",
      monthlySales: "月总收入",
      monthlyCost: "月总成本",
      monthlyNet: "月净收入",
      workingHours: "总工作小时",
      avgNetHour: "平均每小时净收入",
      grabTotal: "Grab 总数",
      boltTotal: "Bolt 总数",
      petrolTotal: "打油总数",
      bankInTotal: "Bank in 总数",
      walletPayoutTotal: "钱包 payout 总数",
      mortgageTarget: "房贷目标",
      carRentTarget: "车租目标",
      monthlyCommitment: "月固定目标",
      suggestedWeekly: "建议每周净收入",
      balance: "还差",
      sundays: "个星期日",
      tngTotal: "Touch n Go 总数",
      incomeOverview: "收入总览",
      totalEarned: "一共净赚",
      monthEarned: "本月净赚",
      weekEarned: "本周净赚",
      grabEarned: "Grab 净赚",
      boltEarned: "Bolt 净赚",
      workCalendar: "开工日历",
      rateHint: "建议",
      holiday: "假期",
      weekend: "周末",
      goodWorkDay: "可能比较好跑",
      normalWorkDay: "普通日子",
      nextDays: "未来几天",
      draftSaved: "已自动暂存",
      closedToday: "今天已结束",
      nextBoltPayout: "下次 Bolt payout",
      paidOn: "预计到账",
      authUsernamePlaceholder: "Username",
      authPasswordPlaceholder: "Password",
      authLogin: "登录",
      authLogout: "退出",
      authLocal: "本机",
      authSynced: "已同步",
      authLoginFailed: "登录失败",
      authUnknownUser: "Username 不存在",
      authUnavailable: "云同步未设置"
    },
    en: {
      appEyebrow: "Live driver finance",
      titleDaily: "Daily Target",
      titleWeek: "Weekly Dashboard",
      titleCash: "Cash Movement",
      titleCompare: "Platform Compare",
      titleMonth: "Monthly Report",
      newRecord: "New",
      duplicateYesterday: "Duplicate Yesterday",
      editPast: "Edit Past Record",
      shift: "Shift",
      date: "Date",
      startTime: "Start time",
      endTime: "End time",
      secondStart: "Second start",
      secondEnd: "Second end",
      hours: "Total working hours",
      platform: "Platform",
      both: "Grab and Bolt",
      grabOnly: "Grab only",
      boltOnly: "Bolt only",
      jobs: "Number of jobs",
      balanceTitle: "Start / End Balance",
      calculateToday: "Calculate Today",
      balanceHelp: "Type the balances you see. If start is blank, the app uses the nearest previous saved end balance.",
      startColumn: "Start",
      endColumn: "End",
      smartTagCard: "Smart Tag card",
      receivedTitle: "Today Received",
      walletPL: "Wallet profit or loss",
      cashCollected: "Cash collected",
      tngCollected: "TNG E-Wallet collected",
      totalCashCollected: "Cash total",
      totalTngCollected: "TNG E-Wallet total",
      extraBonus: "Extra Bonus",
      extraCost: "Extra Cost",
      extraNotes: "Extra notes",
      costs: "Costs",
      petrol: "Petrol",
      tngCost: "SmartTAG Balance",
      insurance: "Grab insurance",
      otherCost: "Other cost",
      notes: "Notes",
      todaySummary: "Today Summary",
      todaySales: "Total Sales Today",
      todayNet: "Net Income Today",
      todayHourly: "Net Per Hour",
      todayCost: "Total Cost Today",
      costCategory: "Cost by Category",
      other: "Other",
      delete: "Delete",
      saveToday: "Save Draft",
      endDay: "End Today",
      weekTitle: "This Week",
      weekHelp: "Weekly net, car rent target, mortgage target, and current progress.",
      movementAmount: "Amount",
      movementType: "Type",
      saveMovement: "Save Movement",
      month: "Month",
      navDay: "Entry",
      navWeek: "Week",
      navCash: "Cash",
      navCompare: "Compare",
      navMonth: "Month",
      noHoliday: "No public holiday note",
      holidayPrefix: "Public holiday note",
      weeklyTarget: "Weekly Target",
      stillNeed: "Still Need",
      completed: "Completed",
      finishWeek: "To finish this week",
      needPerDay: "Need Per Day",
      daysLeft: "days left",
      commitment: "Commitment",
      rentMortgage: "Rent + mortgage share",
      thisWeekSales: "This Week Sales",
      thisWeekCost: "This Week Cost",
      thisWeekNet: "This Week Net Income",
      thisWeekHours: "This Week Hours",
      thisWeekJobs: "This Week Jobs",
      netPerHour: "Net Per Hour",
      grabWeek: "Grab This Week",
      boltWeek: "Bolt This Week",
      petrolWeek: "Petrol This Week",
      tngWeek: "Touch n Go This Week",
      refund: "Refund",
      noMovement: "No cash movement yet",
      edit: "Edit",
      totalSales: "Total sales",
      totalNetIncome: "Total net income",
      totalJobs: "Total jobs",
      totalHours: "Total hours",
      avgHour: "Average income per hour",
      avgJob: "Average income per job",
      bestDay: "Best performing day",
      bestRange: "Best performing time range",
      monthlySales: "Monthly total sales",
      monthlyCost: "Monthly total cost",
      monthlyNet: "Monthly net income",
      workingHours: "Total working hours",
      avgNetHour: "Average net per hour",
      grabTotal: "Grab total",
      boltTotal: "Bolt total",
      petrolTotal: "Petrol total",
      bankInTotal: "Bank in total",
      walletPayoutTotal: "Wallet payout total",
      mortgageTarget: "Mortgage Target",
      carRentTarget: "Car Rent Target",
      monthlyCommitment: "Total Monthly Commitment",
      suggestedWeekly: "Suggested Weekly Net Target",
      balance: "Balance",
      sundays: "Sundays",
      tngTotal: "Touch n Go total",
      incomeOverview: "Income Overview",
      totalEarned: "Total Net Earned",
      monthEarned: "Month Net",
      weekEarned: "Week Net",
      grabEarned: "Grab Net",
      boltEarned: "Bolt Net",
      workCalendar: "Work Calendar",
      rateHint: "Hint",
      holiday: "Holiday",
      weekend: "Weekend",
      goodWorkDay: "Likely better demand",
      normalWorkDay: "Normal day",
      nextDays: "Next days",
      draftSaved: "Draft saved",
      closedToday: "Today closed",
      nextBoltPayout: "Next Bolt payout",
      paidOn: "Paid on",
      authUsernamePlaceholder: "Username",
      authPasswordPlaceholder: "Password",
      authLogin: "Login",
      authLogout: "Logout",
      authLocal: "Local",
      authSynced: "Synced",
      authLoginFailed: "Login failed",
      authUnknownUser: "Unknown username",
      authUnavailable: "Cloud sync not set"
    }
  };

  function t(key) {
    return copy[currentLanguage][key] || copy.en[key] || key;
  }

  function setText(id, key) {
    const element = $(id);
    if (element) element.textContent = t(key);
  }

  function applyLanguage() {
    document.documentElement.lang = currentLanguage === "zh" ? "zh-Hans" : "en";
    document.title = currentLanguage === "zh" ? "每日收入记录" : "Daily Income Tracker";
    $("languageToggleBtn").textContent = currentLanguage === "zh" ? "EN" : "中";
    $("exportExcelBtn").title = currentLanguage === "zh" ? "导出 Excel" : "Export Excel";
    $("exportExcelBtn").setAttribute("aria-label", $("exportExcelBtn").title);
    $("authUsername").placeholder = t("authUsernamePlaceholder");
    $("authPassword").placeholder = t("authPasswordPlaceholder");

    const activeNav = document.querySelector(".bottom-nav button.active");
    $("pageTitle").textContent = activeNav ? t(activeNav.dataset.titleKey) : t("titleDaily");

    [
      ["appEyebrow", "appEyebrow"], ["newRecordBtn", "newRecord"], ["duplicateBtn", "duplicateYesterday"],
      ["shiftTitle", "shift"], ["dateLabel", "date"], ["startTimeLabel", "startTime"],
      ["endTimeLabel", "endTime"], ["secondStartTimeLabel", "secondStart"], ["secondEndTimeLabel", "secondEnd"],
      ["hoursLabel", "hours"], ["platformLabel", "platform"], ["jobsLabel", "jobs"],
      ["balanceTitle", "balanceTitle"], ["applyBalancesBtn", "calculateToday"], ["balanceHelp", "balanceHelp"],
      ["startColumnLabel", "startColumn"], ["endColumnLabel", "endColumn"], ["smartTagCardLabel", "smartTagCard"], ["smartTagCardEndLabel", "smartTagCard"],
      ["receivedTitle", "receivedTitle"], ["totalCashCollectedLabel", "totalCashCollected"], ["totalTngCollectedLabel", "totalTngCollected"],
      ["extraBonusLabel", "extraBonus"], ["extraCostLabel", "extraCost"], ["extraNotesLabel", "extraNotes"],
      ["costsTitle", "costs"], ["petrolCostLabel", "petrol"], ["tngCostLabel", "tngCost"],
      ["insuranceCostLabel", "insurance"], ["otherCostLabel", "otherCost"], ["notesTitle", "notes"],
      ["todaySummaryTitle", "todaySummary"], ["todaySalesLabel", "todaySales"], ["todayNetLabel", "todayNet"],
      ["todayHourlyLabel", "todayHourly"], ["todayCostLabel", "todayCost"], ["costCategoryTitle", "costCategory"],
      ["petrolBreakdownLabel", "petrol"], ["tngBreakdownLabel", "tngCost"], ["insuranceBreakdownLabel", "insurance"],
      ["otherBreakdownLabel", "other"], ["deleteRecordBtn", "delete"], ["saveClosingBtn", "saveToday"], ["endDayBtn", "endDay"], ["weekTitle", "weekTitle"],
      ["weekHelp", "weekHelp"], ["cashMovementTitle", "titleCash"], ["movementDateLabel", "date"],
      ["movementTypeLabel", "movementType"], ["movementAmountLabel", "movementAmount"], ["movementNotesLabel", "notes"],
      ["saveMovementBtn", "saveMovement"], ["monthFilterLabel", "month"]
    ].forEach(([id, key]) => setText(id, key));

    document.querySelector("#platformMode option[value='both']").textContent = t("both");
    document.querySelector("#platformMode option[value='grab']").textContent = t("grabOnly");
    document.querySelector("#platformMode option[value='bolt']").textContent = t("boltOnly");
    document.querySelector("#movementType option[value='bankIn']").textContent = movementLabel("bankIn");
    document.querySelector("#movementType option[value='walletPayout']").textContent = movementLabel("walletPayout");
    document.querySelector("#movementType option[value='cashWithdraw']").textContent = movementLabel("cashWithdraw");
    document.querySelector("#movementType option[value='refundReceived']").textContent = movementLabel("refundReceived");
    document.querySelector("#movementType option[value='manualAdjustment']").textContent = movementLabel("manualAdjustment");

    $("nav-closing").textContent = t("navDay");
    $("nav-dashboard").textContent = t("navWeek");
    $("nav-cash").textContent = t("navCash");
    $("nav-compare").textContent = t("navCompare");
    $("nav-monthly").textContent = t("navMonth");

    if (isAppUnlocked) renderAll();
    updateAuthUi();
  }

  const $ = (id) => document.getElementById(id);
  const formatMoney = (value) => `RM ${Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const num = (value) => Number.parseFloat(value) || 0;
  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));

  function emptyState() {
    return { records: [], movements: [], deletedRecordIds: [], seededNoteVersion: "", lastSyncedAt: "" };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        records: Array.isArray(saved?.records) ? saved.records : [],
        movements: Array.isArray(saved?.movements) ? saved.movements : [],
        deletedRecordIds: Array.isArray(saved?.deletedRecordIds) ? saved.deletedRecordIds : [],
        seededNoteVersion: saved?.seededNoteVersion || "",
        lastSyncedAt: saved?.lastSyncedAt || ""
      };
    } catch {
      return { records: [], movements: [], deletedRecordIds: [], seededNoteVersion: "", lastSyncedAt: "" };
    }
  }

  function replaceState(nextState) {
    state.records = nextState.records || [];
    state.movements = nextState.movements || [];
    state.deletedRecordIds = nextState.deletedRecordIds || [];
    state.seededNoteVersion = nextState.seededNoteVersion || "";
    state.lastSyncedAt = nextState.lastSyncedAt || "";
  }

  function clearPrivateUi() {
    $("incomeOverview").innerHTML = "";
    $("dashboardGoals").innerHTML = "";
    $("weekAlert").textContent = "";
    $("dashboardMetrics").innerHTML = "";
    $("movementList").innerHTML = "";
    $("comparisonGrid").innerHTML = "";
    $("monthlyGoals").innerHTML = "";
    $("monthlyMetrics").innerHTML = "";
  }

  function unlockPrivateApp() {
    if (isAppUnlocked) return;
    replaceState(loadState());
    seedManualNoteData();
    resetDailyForm();
    isAppUnlocked = true;
    document.body.classList.remove("auth-locked");
    renderAll();
  }

  function lockPrivateApp() {
    isAppUnlocked = false;
    replaceState(emptyState());
    editingId = null;
    editingMovementId = null;
    document.body.classList.add("auth-locked");
    clearPrivateUi();
  }

  function persist(options = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!options.skipSync) scheduleSupabaseSync();
  }

  function markUpdated(item) {
    item.updatedAt = new Date().toISOString();
    return item;
  }

  function newerItem(localItem, remoteItem) {
    const localTime = Date.parse(localItem?.updatedAt || "") || 0;
    const remoteTime = Date.parse(remoteItem?.updatedAt || "") || 0;
    return remoteTime > localTime ? remoteItem : localItem;
  }

  function mergeById(localItems, remoteItems) {
    const merged = new Map();
    localItems.forEach((item) => merged.set(item.id, item));
    remoteItems.forEach((item) => {
      const current = merged.get(item.id);
      merged.set(item.id, current ? newerItem(current, item) : item);
    });
    return Array.from(merged.values());
  }

  function supabaseReady() {
    return Boolean(supabaseClient && supabaseUserId);
  }

  function scheduleSupabaseSync(delay = SUPABASE_SYNC_DELAY) {
    if (!supabaseReady()) return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncSupabaseState, delay);
  }

  async function initSupabaseSync() {
    const url = SUPABASE_CONFIG.url;
    const anonKey = SUPABASE_CONFIG.anonKey;
    if (!url || !anonKey || !window.supabase?.createClient) {
      updateAuthUi(t("authUnavailable"));
      return;
    }

    try {
      supabaseClient = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        supabaseUserId = session?.user?.id || null;
        updateAuthUi();
        if (supabaseUserId) {
          unlockPrivateApp();
          await pullSupabaseState();
          scheduleSupabaseSync(0);
        } else {
          lockPrivateApp();
        }
      });

      const sessionResult = await supabaseClient.auth.getSession();
      const session = sessionResult.data?.session;

      supabaseUserId = session?.user?.id || null;
      updateAuthUi();
      if (!supabaseUserId) return;

      unlockPrivateApp();
      await pullSupabaseState();
      scheduleSupabaseSync(0);
    } catch (error) {
      console.warn("Supabase sync unavailable. Local storage is still active.", error);
    }
  }

  function rowPayload(row) {
    return { ...(row.payload || {}), id: row.payload?.id || row.id, updatedAt: row.payload?.updatedAt || row.updated_at };
  }

  async function pullSupabaseState() {
    if (!supabaseReady()) return;

    const [recordResult, movementResult, metaResult] = await Promise.all([
      supabaseClient.from("daily_records").select("id,date,payload,updated_at"),
      supabaseClient.from("cash_movements").select("id,date,payload,updated_at"),
      supabaseClient.from("app_meta").select("key,payload").eq("key", "state").maybeSingle()
    ]);

    if (recordResult.error) throw recordResult.error;
    if (movementResult.error) throw movementResult.error;
    if (metaResult.error) throw metaResult.error;

    const remoteMeta = metaResult.data?.payload || {};
    const deletedRecordIds = Array.from(new Set([
      ...(state.deletedRecordIds || []),
      ...(remoteMeta.deletedRecordIds || [])
    ]));
    const deletedSet = new Set(deletedRecordIds);
    const remoteRecords = (recordResult.data || []).map(rowPayload).filter((record) => !deletedSet.has(record.id));
    const remoteMovements = (movementResult.data || []).map(rowPayload);

    state.records = mergeById(state.records, remoteRecords)
      .filter((record) => !deletedSet.has(record.id))
      .sort((a, b) => b.date.localeCompare(a.date));
    state.movements = mergeById(state.movements, remoteMovements)
      .sort((a, b) => b.date.localeCompare(a.date));
    state.deletedRecordIds = deletedRecordIds;
    state.seededNoteVersion = state.seededNoteVersion || remoteMeta.seededNoteVersion || "";
    state.lastSyncedAt = remoteMeta.lastSyncedAt || state.lastSyncedAt || "";
    persist({ skipSync: true });
    renderAll();
  }

  async function syncSupabaseState() {
    if (!supabaseReady() || isSyncing) return;
    isSyncing = true;
    try {
      const now = new Date().toISOString();
      const recordRows = state.records.map((record) => ({
        id: record.id,
        owner_id: supabaseUserId,
        date: record.date,
        payload: record,
        updated_at: record.updatedAt || now
      }));
      const movementRows = state.movements.map((movement) => ({
        id: movement.id,
        owner_id: supabaseUserId,
        date: movement.date,
        payload: movement,
        updated_at: movement.updatedAt || now
      }));

      if (recordRows.length) {
        const result = await supabaseClient.from("daily_records").upsert(recordRows, { onConflict: "id" });
        if (result.error) throw result.error;
      }
      if (movementRows.length) {
        const result = await supabaseClient.from("cash_movements").upsert(movementRows, { onConflict: "id" });
        if (result.error) throw result.error;
      }

      await deleteSupabaseRecords(state.deletedRecordIds || []);
      const metaResult = await supabaseClient.from("app_meta").upsert({
        owner_id: supabaseUserId,
        key: "state",
        payload: {
          seededNoteVersion: state.seededNoteVersion,
          deletedRecordIds: state.deletedRecordIds || [],
          lastSyncedAt: now
        }
      }, { onConflict: "owner_id,key" });
      if (metaResult.error) throw metaResult.error;

      state.lastSyncedAt = now;
      persist({ skipSync: true });
    } catch (error) {
      console.warn("Supabase sync failed. Changes remain saved locally.", error);
    } finally {
      isSyncing = false;
    }
  }

  async function deleteSupabaseRecords(ids) {
    if (!supabaseReady() || !ids.length) return;
    const result = await supabaseClient.from("daily_records").delete().in("id", ids);
    if (result.error) throw result.error;
  }

  function updateAuthUi(message = "") {
    const usernameInput = $("authUsername");
    const passwordInput = $("authPassword");
    const loginButton = $("authLoginBtn");
    const logoutButton = $("authLogoutBtn");
    const status = $("authStatus");
    if (!usernameInput || !passwordInput || !loginButton || !logoutButton || !status) return;

    const isLoggedIn = Boolean(supabaseUserId);
    usernameInput.classList.toggle("hidden", isLoggedIn);
    passwordInput.classList.toggle("hidden", isLoggedIn);
    loginButton.classList.toggle("hidden", isLoggedIn);
    logoutButton.classList.toggle("hidden", !isLoggedIn);
    loginButton.textContent = t("authLogin");
    logoutButton.textContent = t("authLogout");
    status.textContent = message || (isLoggedIn ? t("authSynced") : t("authLocal"));
  }

  async function loginWithPassword() {
    if (!supabaseClient) {
      updateAuthUi(t("authUnavailable"));
      return;
    }
    const username = $("authUsername").value.trim().toLowerCase();
    const password = $("authPassword").value;
    const email = USERNAME_EMAIL_MAP[username];
    if (!email) {
      updateAuthUi(t("authUnknownUser"));
      return;
    }
    if (!password) return;

    try {
      const result = await supabaseClient.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      $("authPassword").value = "";
    } catch (error) {
      console.warn("Password login failed.", error);
      updateAuthUi(t("authLoginFailed"));
    }
  }

  async function signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    supabaseUserId = null;
    lockPrivateApp();
    updateAuthUi();
  }

  function dailyDefaults() {
    return {
      id: uid(),
      date: today,
      startTime: "",
      endTime: "",
      secondStartTime: "",
      secondEndTime: "",
      platformMode: "bolt",
      jobs: 0,
      grabWallet: 0,
      grabCash: 0,
      grabTng: 0,
      grabRefund: 0,
      boltWallet: 0,
      boltCash: 0,
      boltTng: 0,
      totalCashCollected: 0,
      totalTngCollected: 0,
      extraBonus: 0,
      extraCost: 0,
      extraNotes: "",
      petrolCost: 0,
      tngCost: 0,
      insuranceCost: 0,
      otherCost: 0,
      tngEwalletStart: "",
      tngEwalletEnd: "",
      tngCardStart: "",
      tngCardEnd: "",
      grabCashWalletStart: "",
      grabCashWalletEnd: "",
      grabCreditWalletStart: "",
      grabCreditWalletEnd: "",
      boltWalletStart: "",
      boltWalletEnd: "",
      notes: ""
    };
  }

  function seedManualNoteData() {
    const seedRecords = [
      {
        id: "seed-opening-2026-05-29",
        date: "2026-05-29",
        startTime: "",
        endTime: "",
        secondStartTime: "",
        secondEndTime: "",
        platformMode: "bolt",
        jobs: 0,
        grabWallet: 2184.32,
        grabCash: 0,
        grabTng: 0,
        grabRefund: 170,
        boltWallet: 1969.03,
        boltCash: 0,
        boltTng: 0,
        totalCashCollected: 0,
        totalTngCollected: 0,
        petrolCost: 0,
        tngCost: 0,
        insuranceCost: 0,
        otherCost: 1747.25,
        status: "closed",
        notes: "Opening balance from phone notes before 30 May 2026. Grand refund Grab RM170. Grand sales RM4323.35, cost RM1747.25, net RM2576.10."
      },
      {
        id: "seed-daily-2026-05-30",
        date: "2026-05-30",
        startTime: "06:00",
        endTime: "11:00",
        secondStartTime: "",
        secondEndTime: "",
        platformMode: "bolt",
        jobs: 8,
        grabWallet: 0,
        grabCash: 0,
        grabTng: 0,
        grabRefund: 0,
        boltWallet: 18.01,
        boltCash: 80,
        boltTng: 0,
        totalCashCollected: 80,
        totalTngCollected: 0,
        petrolCost: 39.03,
        tngCost: 11.42,
        insuranceCost: 0,
        otherCost: 0,
        tngEwalletStart: "",
        tngEwalletEnd: "",
        tngCardStart: 180.04,
        tngCardEnd: 179.04,
        grabCashWalletStart: 340.11,
        grabCashWalletEnd: 347.41,
        grabCreditWalletStart: 2.82,
        grabCreditWalletEnd: 2.82,
        boltWalletStart: 124.64,
        boltWalletEnd: 142.65,
        status: "closed",
        notes: "Bolt 8 jobs. 6am to 11am. Bolt wallet RM124.64 to RM142.65. Cash RM80. TNG eWallet negative RM10.42 treated as cost, Touchngo RM180.04 to RM179.04 cost RM1. Petrol RM39.03. Total cost RM50.45, Bolt sales RM98.01."
      },
      {
        id: "seed-daily-2026-05-31",
        date: "2026-05-31",
        startTime: "06:15",
        endTime: "18:15",
        secondStartTime: "",
        secondEndTime: "",
        platformMode: "bolt",
        jobs: 18,
        grabWallet: 0,
        grabCash: 0,
        grabTng: 0,
        grabRefund: 0,
        boltWallet: 168.85,
        boltCash: 127,
        boltTng: 105.75,
        totalCashCollected: 127,
        totalTngCollected: 105.75,
        petrolCost: 58.56,
        tngCost: 6.64,
        insuranceCost: 0,
        otherCost: 0,
        tngEwalletStart: "",
        tngEwalletEnd: "",
        tngCardStart: 179.04,
        tngCardEnd: 172.40,
        grabCashWalletStart: 340.11,
        grabCashWalletEnd: 347.41,
        grabCreditWalletStart: 2.82,
        grabCreditWalletEnd: 2.82,
        boltWalletStart: 142.65,
        boltWalletEnd: 311.50,
        status: "closed",
        notes: "Bolt 18 jobs. 6.15am to 6.15pm. Bolt wallet RM142.65 to RM311.50. Cash RM127, TNG E-Wallet received RM105.75. SmartTAG/Touchngo RM179.04 to RM172.40 cost RM6.64. Petrol RM37.15 + RM11.46 + RM9.95 = RM58.56. Total cost RM65.20, Bolt sales RM401.60."
      },
      {
        id: "seed-daily-2026-06-01",
        date: "2026-06-01",
        startTime: "06:15",
        endTime: "09:15",
        secondStartTime: "14:00",
        secondEndTime: "16:00",
        platformMode: "bolt",
        jobs: 6,
        grabWallet: 0,
        grabCash: 0,
        grabTng: 0,
        grabRefund: 0,
        boltWallet: 61.83,
        boltCash: 131,
        boltTng: 0,
        totalCashCollected: 131,
        totalTngCollected: 0,
        petrolCost: 54.34,
        tngCost: 26.46,
        insuranceCost: 0,
        otherCost: 0,
        tngEwalletStart: "",
        tngEwalletEnd: "",
        tngCardStart: 172.40,
        tngCardEnd: 151.49,
        grabCashWalletStart: 340.11,
        grabCashWalletEnd: 347.41,
        grabCreditWalletStart: 2.82,
        grabCreditWalletEnd: 2.82,
        boltWalletStart: 0,
        boltWalletEnd: 61.83,
        status: "closed",
        notes: "Bolt 6 jobs. 6.15am to 9.15am and 2pm to 4pm. Bolt wallet RM0 to RM61.83, payable on 8 June by weekly payout habit. Cash RM131. TNG E-Wallet negative RM5.55 plus SmartTAG/Touchngo RM172.40 to RM151.49 cost RM20.91. Petrol RM12.09 + RM42.25 = RM54.34. Bank in RM1600 recorded separately. Total cost RM80.80, Bolt sales RM192.83."
      },
      {
        id: "seed-daily-2026-06-02",
        date: "2026-06-02",
        startTime: "",
        endTime: "",
        secondStartTime: "",
        secondEndTime: "",
        platformMode: "bolt",
        jobs: 0,
        grabWallet: 0,
        grabCash: 0,
        grabTng: 0,
        grabRefund: 0,
        boltWallet: 0,
        boltCash: 0,
        boltTng: 0,
        totalCashCollected: 0,
        totalTngCollected: 0,
        petrolCost: 0,
        tngCost: 0,
        insuranceCost: 0,
        otherCost: 0,
        status: "draft",
        notes: "Placeholder from phone note: 2 June 2026 Bolt, data not completed yet."
      }
    ];

    const seedMovements = [
      {
        id: "seed-movement-2026-05-16-grab-withdraw",
        date: "2026-05-16",
        type: "cashWithdraw",
        amount: 926.84,
        notes: "Grab cash wallet withdrawal from phone notes."
      },
      {
        id: "seed-movement-2026-05-25-bolt-paid",
        date: "2026-05-25",
        type: "walletPayout",
        amount: 459.03,
        notes: "Bolt wallet paid on 25 May."
      },
      {
        id: "seed-movement-2026-06-01-bank-in",
        date: "2026-06-01",
        type: "bankIn",
        amount: 1600,
        notes: "Bank in from phone notes."
      },
      {
        id: "seed-movement-2026-06-01-bolt-paid",
        date: "2026-06-01",
        type: "walletPayout",
        amount: 311.50,
        notes: "Bolt wallet paid on 1 June."
      },
      {
        id: "seed-movement-2026-06-01-cash-balance-note",
        date: "2026-06-01",
        type: "manualAdjustment",
        amount: 530,
        notes: "Manual note: up-to-date total cash RM530 (RM350 + RM180)."
      }
    ];

    let changed = false;
    seedRecords.forEach((record) => {
      const existingIndex = state.records.findIndex((item) => item.id === record.id || item.date === record.date);
      if (existingIndex >= 0 && state.seededNoteVersion !== SEEDED_NOTE_VERSION) {
        state.records[existingIndex] = { ...dailyDefaults(), ...state.records[existingIndex], ...record };
        changed = true;
      } else if (existingIndex < 0) {
        state.records.push({ ...dailyDefaults(), ...record });
        changed = true;
      }
    });
    seedMovements.forEach((movement) => {
      if (!state.movements.some((item) => item.id === movement.id)) {
        state.movements.push(movement);
        changed = true;
      }
    });
    if (changed) {
      state.records.sort((a, b) => b.date.localeCompare(a.date));
      state.movements.sort((a, b) => b.date.localeCompare(a.date));
      state.seededNoteVersion = SEEDED_NOTE_VERSION;
      persist();
    }
  }

  function hoursBetween(start, end) {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
  }

  function parseDate(dateText) {
    return new Date(`${dateText}T12:00:00`);
  }

  function dateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function getWeekRange(dateText) {
    const date = parseDate(dateText);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(date);
    start.setDate(date.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: dateKey(start), end: dateKey(end) };
  }

  function countSundaysInMonth(monthText) {
    const [year, month] = monthText.split("-").map(Number);
    const date = new Date(year, month - 1, 1, 12);
    let count = 0;
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 0) count += 1;
      date.setDate(date.getDate() + 1);
    }
    return count;
  }

  function recordsBetween(startDate, endDate) {
    return state.records.filter((record) => record.date >= startDate && record.date <= endDate);
  }

  function recordsForMonth(monthText) {
    return state.records.filter((record) => record.date.startsWith(monthText));
  }

  function goalStatusClass(value) {
    return value <= 0 ? "good" : "attention";
  }

  function weeklyTargetForMonth(monthText) {
    return WEEKLY_RENT_TARGET + (MONTHLY_MORTGAGE_TARGET / Math.max(countSundaysInMonth(monthText), 1));
  }

  function goalCard(label, amount, detail, status = "") {
    return `
      <article class="goal-card ${status}">
        <span>${escapeHtml(label)}</span>
        <strong>${amount}</strong>
        <small>${escapeHtml(detail)}</small>
      </article>
    `;
  }

  function daysUntilInclusive(dateText) {
    const target = parseDate(dateText);
    const current = parseDate(today);
    const diff = Math.ceil((target - current) / 86400000) + 1;
    return Math.max(diff, 1);
  }

  function calculate(record) {
    const hours = hoursBetween(record.startTime, record.endTime) + hoursBetween(record.secondStartTime, record.secondEndTime);
    const refund = num(record.grabRefund);
    const grabSales = num(record.grabWallet) + num(record.grabCash) + num(record.grabTng);
    const boltSales = num(record.boltWallet) + num(record.boltCash) + num(record.boltTng);
    const totalSales = grabSales + boltSales + refund + num(record.extraBonus);
    const insuranceCost = record.platformMode === "grab" || record.platformMode === "both" ? 5.5 : num(record.insuranceCost);
    const totalCost = num(record.petrolCost) + num(record.tngCost) + insuranceCost + num(record.otherCost) + num(record.extraCost);
    const net = totalSales - totalCost;
    return {
      hours,
      grabSales,
      boltSales,
      refund,
      insuranceCost,
      totalSales,
      totalCost,
      net,
      hourly: hours ? net / hours : 0
    };
  }

  function hasValue(id) {
    return $(id).value !== "";
  }

  function previousBalance(field, dateText) {
    const previous = state.records
      .filter((record) => record.id !== editingId && record.date < dateText && record[field] !== "" && record[field] !== undefined && record[field] !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
      .find((record) => Number.isFinite(Number(record[field])) && Number(record[field]) !== 0);
    return previous ? num(previous[field]) : null;
  }

  function signedDelta(startId, endId) {
    if (!hasValue(endId)) return null;
    const selectedDate = $("date").value || today;
    const startValue = hasValue(startId) ? num($(startId).value) : previousBalance(endId, selectedDate);
    if (startValue === null) return null;
    if (!hasValue(startId)) $(startId).placeholder = `Last ${startValue.toFixed(2)}`;
    return Math.round((num($(endId).value) - startValue) * 100) / 100;
  }

  function setCalculatedAmount(id, value) {
    $(id).value = Math.abs(value) > 0 ? value.toFixed(2) : "";
  }

  function setMetricStatus(id, isProfit) {
    const card = $(id).closest(".metric");
    if (!card) return;
    card.classList.toggle("profit", isProfit);
    card.classList.toggle("loss", !isProfit);
  }

  function applyBalanceDifferences() {
    const mode = $("platformMode").value;
    const tngEwalletDelta = signedDelta("tngEwalletStart", "tngEwalletEnd");
    const tngCardDelta = signedDelta("tngCardStart", "tngCardEnd");
    const grabCashWalletDelta = signedDelta("grabCashWalletStart", "grabCashWalletEnd");
    const boltWalletDelta = signedDelta("boltWalletStart", "boltWalletEnd");

    if (grabCashWalletDelta !== null) setCalculatedAmount("grabWallet", grabCashWalletDelta);
    if (boltWalletDelta !== null) setCalculatedAmount("boltWallet", boltWalletDelta);

    if (tngEwalletDelta !== null && tngEwalletDelta > 0) {
      $("grabTng").value = "";
      $("boltTng").value = "";
      if (mode === "grab") setCalculatedAmount("grabTng", tngEwalletDelta);
      else setCalculatedAmount("boltTng", tngEwalletDelta);
    }

    const ewalletCost = tngEwalletDelta !== null && tngEwalletDelta < 0 ? Math.abs(tngEwalletDelta) : 0;
    const cardCost = tngCardDelta !== null && tngCardDelta < 0 ? Math.abs(tngCardDelta) : 0;
    if (tngEwalletDelta !== null || tngCardDelta !== null) setCalculatedAmount("tngCost", ewalletCost + cardCost);

    refreshLiveTotals();
  }

  function updateHolidayNote() {
    const selected = $("date").value;
    const holiday = holidays2026[selected];
    $("holidayNote").textContent = holiday ? `${t("holidayPrefix")}: ${holiday}` : t("noHoliday");
    $("holidayNote").classList.toggle("active", Boolean(holiday));
  }

  function readDailyForm() {
    const record = { id: editingId || uid() };
    fields.forEach((field) => {
      if (balanceFields.includes(field) && field !== "platformMode" && $(field).value === "") {
        record[field] = "";
      } else {
        record[field] = moneyFields.includes(field) || field === "jobs" ? num($(field).value) : $(field).value;
      }
    });
    record.grabCash = 0;
    record.grabTng = 0;
    record.boltCash = 0;
    record.boltTng = 0;
    if (record.platformMode === "grab") {
      record.grabCash = num(record.totalCashCollected);
      record.grabTng = num(record.totalTngCollected);
    } else {
      record.boltCash = num(record.totalCashCollected);
      record.boltTng = num(record.totalTngCollected);
    }
    record.hours = calculate(record).hours;
    if (record.platformMode === "grab" || record.platformMode === "both") record.insuranceCost = 5.5;
    return record;
  }

  function upsertRecord(record) {
    markUpdated(record);
    const existingIndex = state.records.findIndex((item) => item.id === record.id);
    const sameDateIndex = state.records.findIndex((item) => item.date === record.date && item.id !== record.id);
    if (sameDateIndex >= 0) {
      const removed = state.records.splice(sameDateIndex, 1)[0];
      if (removed?.id) state.deletedRecordIds = Array.from(new Set([...(state.deletedRecordIds || []), removed.id]));
    }
    if (existingIndex >= 0) {
      state.records[existingIndex] = record;
    } else {
      state.records.push(record);
    }
    state.deletedRecordIds = (state.deletedRecordIds || []).filter((id) => id !== record.id);
    state.records.sort((a, b) => b.date.localeCompare(a.date));
    editingId = record.id;
    persist();
  }

  function fillDailyForm(record) {
    editingId = record.id;
    fields.forEach((field) => {
      const value = record[field] ?? "";
      $(field).value = moneyFields.includes(field) && num(value) === 0 ? "" : value;
    });
    refreshLiveTotals();
    $("deleteRecordBtn").disabled = !state.records.some((item) => item.id === editingId);
  }

  function resetDailyForm() {
    fillDailyForm(dailyDefaults());
    editingId = null;
    $("deleteRecordBtn").disabled = true;
    $("recordPicker").value = "";
  }

  function saveDailyRecord(event) {
    event.preventDefault();
    const record = readDailyForm();
    record.status = "draft";
    upsertRecord(record);
    renderAll();
  }

  function autoSaveDraft() {
    if (isAutoSaving) return;
    isAutoSaving = true;
    const record = readDailyForm();
    record.status = record.status || "draft";
    upsertRecord(record);
    renderRecordPicker();
    renderIncomeOverview();
    renderDashboard();
    isAutoSaving = false;
  }

  function endToday() {
    applyBalanceDifferences();
    const record = readDailyForm();
    record.status = "closed";
    record.closedAt = new Date().toISOString();
    upsertRecord(record);
    renderAll();
  }

  function duplicateYesterday() {
    const selectedDate = $("date").value || today;
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() - 1);
    const yesterday = date.toISOString().slice(0, 10);
    const source = state.records.find((record) => record.date === yesterday) || state.records[0];
    const base = source ? { ...source } : dailyDefaults();
    const duplicate = {
      ...base,
      id: uid(),
      date: selectedDate,
      grabWallet: 0,
      grabCash: 0,
      grabTng: 0,
      grabRefund: 0,
      boltWallet: 0,
      boltCash: 0,
      boltTng: 0,
      totalCashCollected: 0,
      totalTngCollected: 0,
      extraBonus: 0,
      extraCost: 0,
      extraNotes: "",
      petrolCost: 0,
      tngCost: 0,
      insuranceCost: 0,
      otherCost: 0,
      tngEwalletStart: "",
      tngEwalletEnd: "",
      tngCardStart: "",
      tngCardEnd: "",
      grabCashWalletStart: "",
      grabCashWalletEnd: "",
      grabCreditWalletStart: "",
      grabCreditWalletEnd: "",
      boltWalletStart: "",
      boltWalletEnd: "",
      jobs: 0,
      notes: ""
    };
    fillDailyForm(duplicate);
    editingId = null;
  }

  function deleteDailyRecord() {
    if (!editingId) return;
    const index = state.records.findIndex((record) => record.id === editingId);
    if (index >= 0) {
      const removed = state.records.splice(index, 1)[0];
      if (removed?.id) state.deletedRecordIds = Array.from(new Set([...(state.deletedRecordIds || []), removed.id]));
    }
    persist();
    resetDailyForm();
    renderAll();
  }

  function refreshLiveTotals() {
    const record = readDailyForm();
    const totals = calculate(record);
    $("hours").value = totals.hours ? totals.hours.toFixed(2) : "";
    $("todaySales").textContent = formatMoney(totals.totalSales);
    $("todayCost").textContent = formatMoney(totals.totalCost);
    $("todayNet").textContent = formatMoney(totals.net);
    $("todayHourly").textContent = formatMoney(totals.hourly);
    setMetricStatus("todayNet", totals.net >= 0);
    setMetricStatus("todayHourly", totals.hourly >= 0);
    $("petrolBreakdown").textContent = formatMoney(record.petrolCost);
    $("tngBreakdown").textContent = formatMoney(record.tngCost);
    $("insuranceBreakdown").textContent = formatMoney(totals.insuranceCost);
    $("otherBreakdown").textContent = formatMoney(record.otherCost);
    updateHolidayNote();
  }

  function grandTotals(records = state.records, movements = state.movements) {
    const daily = records.reduce((acc, record) => {
      const totals = calculate(record);
      acc.sales += totals.totalSales;
      acc.cost += totals.totalCost;
      acc.net += totals.net;
      acc.grab += totals.grabSales;
      acc.bolt += totals.boltSales;
      acc.refund += num(record.grabRefund);
      acc.cashCollected += num(record.grabCash) + num(record.boltCash);
      acc.tngCollected += num(record.grabTng) + num(record.boltTng);
      acc.hours += totals.hours;
      acc.jobs += num(record.jobs);
      acc.petrol += num(record.petrolCost);
      acc.tngCost += num(record.tngCost);
      return acc;
    }, { sales: 0, cost: 0, net: 0, grab: 0, bolt: 0, refund: 0, cashCollected: 0, tngCollected: 0, hours: 0, jobs: 0, petrol: 0, tngCost: 0 });

    const cash = movements.reduce((acc, movement) => {
      const amount = num(movement.amount);
      acc[movement.type] = (acc[movement.type] || 0) + amount;
      return acc;
    }, {});

    const banked = num(cash.bankIn) + num(cash.walletPayout);
    const cashBalance = daily.cashCollected + num(cash.refundReceived) + num(cash.manualAdjustment) - num(cash.bankIn) - num(cash.cashWithdraw);
    return { ...daily, ...cash, banked, cashBalance };
  }

  function metric(label, value, primary = false, status = "") {
    return `<article class="metric${primary ? " primary" : ""} ${status}"><span>${label}</span><strong>${value}</strong></article>`;
  }

  function overviewCard(label, value, detail = "", status = "happy") {
    return `
      <article class="overview-card ${status}">
        <span>${escapeHtml(label)}</span>
        <strong>${value}</strong>
        <small>${escapeHtml(detail)}</small>
      </article>
    `;
  }

  function totalNetCard(total, grab, bolt) {
    return `
      <article class="overview-card hero total-net-card">
        <span>${escapeHtml(t("totalEarned"))}</span>
        <strong>${formatMoney(total)}</strong>
        <div class="split-net">
          <div>
            <span>${escapeHtml(t("grabEarned"))}</span>
            <b>${formatMoney(grab)}</b>
          </div>
          <div>
            <span>${escapeHtml(t("boltEarned"))}</span>
            <b>${formatMoney(bolt)}</b>
          </div>
        </div>
      </article>
    `;
  }

  function nextMondayFrom(dateText) {
    const date = parseDate(dateText);
    const day = date.getDay();
    const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
    date.setDate(date.getDate() + daysUntilMonday);
    return dateKey(date);
  }

  function latestBoltPayout() {
    return state.records
      .filter((record) => num(record.boltWalletEnd) > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .find(Boolean);
  }

  function renderIncomeOverview() {
    const week = getWeekRange(today);
    const allTotal = grandTotals();
    const monthTotal = grandTotals(recordsForMonth(currentMonth), []);
    const weekTotal = grandTotals(recordsBetween(week.start, week.end), []);
    const grab = platformStats("grab");
    const bolt = platformStats("bolt");
    const payout = latestBoltPayout();

    $("incomeOverview").innerHTML = [
      totalNetCard(allTotal.net, grab.net, bolt.net),
      overviewCard(t("monthEarned"), formatMoney(monthTotal.net), currentMonth, "happy"),
      overviewCard(t("weekEarned"), formatMoney(weekTotal.net), `${week.start} - ${week.end}`, "happy"),
      overviewCard(t("nextBoltPayout"), payout ? formatMoney(payout.boltWalletEnd) : "RM 0.00", payout ? `${t("paidOn")}: ${nextMondayFrom(payout.date)}` : "Bolt", "bolt-tone")
    ].join("");
  }

  function renderWeekAlert() {
    const week = getWeekRange(today);
    const notices = [];
    let date = parseDate(week.start);
    while (dateKey(date) <= week.end) {
      const key = dateKey(date);
      if (holidays2026[key]) notices.push(`${key}: ${holidays2026[key]}`);
      date.setDate(date.getDate() + 1);
    }
    $("weekAlert").textContent = notices.length
      ? `${t("rateHint")}: ${notices.join(" | ")}`
      : currentLanguage === "zh"
        ? "本周没有特别公共假期提醒。"
        : "No special public holiday reminder this week.";
  }

  function renderDashboard() {
    const week = getWeekRange(today);
    const total = grandTotals(recordsBetween(week.start, week.end), []);
    renderDashboardGoals();
    $("dashboardMetrics").innerHTML = [
      metric(t("thisWeekSales"), formatMoney(total.sales), true, "profit"),
      metric(t("thisWeekCost"), formatMoney(total.cost), false, "loss"),
      metric(t("thisWeekNet"), formatMoney(total.net), true, total.net >= 0 ? "profit" : "loss"),
      metric(t("thisWeekHours"), total.hours.toFixed(2)),
      metric(t("thisWeekJobs"), total.jobs.toFixed(0)),
      metric(t("netPerHour"), formatMoney(total.hours ? total.net / total.hours : 0)),
      metric(t("grabWeek"), formatMoney(total.grab)),
      metric(t("boltWeek"), formatMoney(total.bolt)),
      metric(t("petrolWeek"), formatMoney(total.petrol), false, "loss"),
      metric(t("tngWeek"), formatMoney(total.tngCost), false, "loss")
    ].join("");
  }

  function renderDashboardGoals() {
    const week = getWeekRange(today);
    const weekTotal = grandTotals(recordsBetween(week.start, week.end), []);
    const monthTotal = grandTotals(recordsForMonth(currentMonth), []);
    const weekRentBalance = WEEKLY_RENT_TARGET - weekTotal.net;
    const weekTotalTarget = weeklyTargetForMonth(currentMonth);
    const weekTotalBalance = weekTotalTarget - weekTotal.net;
    const monthMortgageBalance = MONTHLY_MORTGAGE_TARGET - monthTotal.net;
    const monthRentTarget = countSundaysInMonth(currentMonth) * WEEKLY_RENT_TARGET;
    const totalMonthCommitment = MONTHLY_MORTGAGE_TARGET + monthRentTarget;
    const totalMonthBalance = totalMonthCommitment - monthTotal.net;
    const daysLeft = daysUntilInclusive(week.end);
    const dailyNeed = Math.max(weekTotalBalance, 0) / daysLeft;

    $("dashboardGoals").innerHTML = [
      goalCard(t("weeklyTarget"), formatMoney(weekTotalTarget), `${week.start} - ${week.end}`, "target hero"),
      goalCard(t("stillNeed"), formatMoney(Math.max(weekTotalBalance, 0)), weekTotalBalance <= 0 ? t("completed") : t("finishWeek"), goalStatusClass(weekTotalBalance)),
      goalCard(t("needPerDay"), formatMoney(dailyNeed), `${daysLeft} ${t("daysLeft")}`, weekTotalBalance <= 0 ? "good compact" : "attention compact"),
      goalCard(t("commitment"), `${formatMoney(WEEKLY_RENT_TARGET)} + ${formatMoney(weekTotalTarget - WEEKLY_RENT_TARGET)}`, t("rentMortgage"), "compact muted-goal")
    ].join("");
  }

  function movementLabel(type) {
    return {
      bankIn: currentLanguage === "zh" ? "Bank in" : "Bank in amount",
      walletPayout: currentLanguage === "zh" ? "钱包 payout 收到" : "Wallet payout received",
      cashWithdraw: currentLanguage === "zh" ? "现金提出" : "Cash withdrawal",
      refundReceived: currentLanguage === "zh" ? "Refund 收到" : "Refund received",
      manualAdjustment: currentLanguage === "zh" ? "手动现金调整" : "Manual cash adjustment"
    }[type] || type;
  }

  function saveMovement(event) {
    event.preventDefault();
    const movement = markUpdated({
      id: editingMovementId || uid(),
      date: $("movementDate").value || today,
      type: $("movementType").value,
      amount: num($("movementAmount").value),
      notes: $("movementNotes").value
    });
    const existingIndex = state.movements.findIndex((item) => item.id === movement.id);
    if (existingIndex >= 0) state.movements[existingIndex] = movement;
    else state.movements.push(movement);
    state.movements.sort((a, b) => b.date.localeCompare(a.date));
    editingMovementId = null;
    $("cashForm").reset();
    $("movementDate").value = today;
    persist();
    renderAll();
  }

  function renderMovements() {
    if (!state.movements.length) {
      $("movementList").innerHTML = `<div class="empty-state">${t("noMovement")}</div>`;
      return;
    }
    $("movementList").innerHTML = state.movements.map((movement) => `
      <article class="movement-item">
        <div class="movement-head">
          <strong>${movementLabel(movement.type)}</strong>
          <strong>${formatMoney(movement.amount)}</strong>
        </div>
        <div class="stat-line"><span>${movement.date}</span><strong>${escapeHtml(movement.notes)}</strong></div>
        <button class="secondary-btn" type="button" data-edit-movement="${movement.id}">${t("edit")}</button>
      </article>
    `).join("");
  }

  function platformStats(platform) {
    let sales = 0;
    let jobs = 0;
    let hours = 0;
    let cost = 0;
    let bestDay = null;
    const ranges = {};

    state.records.forEach((record) => {
      const totals = calculate(record);
      const platformSales = platform === "grab" ? totals.grabSales : totals.boltSales;
      if (!platformSales) return;
      const share = totals.totalSales ? platformSales / totals.totalSales : 0;
      const net = platformSales - totals.totalCost * share;
      const recordHours = totals.hours * share;
      const recordJobs = num(record.jobs) * share;
      sales += platformSales;
      cost += totals.totalCost * share;
      hours += recordHours;
      jobs += recordJobs;
      if (!bestDay || net > bestDay.net) bestDay = { date: record.date, net };
      if (record.startTime && record.endTime) {
        const label = `${record.startTime}-${record.endTime}`;
        ranges[label] = (ranges[label] || 0) + net;
      }
    });

    const bestRange = Object.entries(ranges).sort((a, b) => b[1] - a[1])[0];
    const net = sales - cost;
    return {
      sales,
      net,
      jobs,
      hours,
      hourly: hours ? net / hours : 0,
      perJob: jobs ? net / jobs : 0,
      bestDay: bestDay ? `${bestDay.date} (${formatMoney(bestDay.net)})` : "-",
      bestRange: bestRange ? `${bestRange[0]} (${formatMoney(bestRange[1])})` : "-"
    };
  }

  function renderComparison() {
    $("comparisonGrid").innerHTML = ["grab", "bolt"].map((platform) => {
      const stats = platformStats(platform);
      const name = platform === "grab" ? "Grab" : "Bolt";
      return `
        <article class="platform-panel ${platform}-card">
          <h2>${name}</h2>
          <div class="stat-line"><span>${t("totalSales")}</span><strong>${formatMoney(stats.sales)}</strong></div>
          <div class="stat-line"><span>${t("totalNetIncome")}</span><strong>${formatMoney(stats.net)}</strong></div>
          <div class="stat-line"><span>${t("totalJobs")}</span><strong>${stats.jobs.toFixed(0)}</strong></div>
          <div class="stat-line"><span>${t("totalHours")}</span><strong>${stats.hours.toFixed(2)}</strong></div>
          <div class="stat-line"><span>${t("avgHour")}</span><strong>${formatMoney(stats.hourly)}</strong></div>
          <div class="stat-line"><span>${t("avgJob")}</span><strong>${formatMoney(stats.perJob)}</strong></div>
          <div class="stat-line"><span>${t("bestDay")}</span><strong>${stats.bestDay}</strong></div>
          <div class="stat-line"><span>${t("bestRange")}</span><strong>${stats.bestRange}</strong></div>
        </article>
      `;
    }).join("");
  }

  function renderMonthly() {
    const month = $("monthFilter").value || currentMonth;
    const records = state.records.filter((record) => record.date.startsWith(month));
    const movements = state.movements.filter((movement) => movement.date.startsWith(month));
    const total = grandTotals(records, movements);
    renderMonthlyGoals(month, total);
    $("monthlyMetrics").innerHTML = [
      metric(t("monthlySales"), formatMoney(total.sales), true),
      metric(t("monthlyCost"), formatMoney(total.cost)),
      metric(t("monthlyNet"), formatMoney(total.net)),
      metric(t("workingHours"), total.hours.toFixed(2)),
      metric(t("avgNetHour"), formatMoney(total.hours ? total.net / total.hours : 0)),
      metric(t("grabTotal"), formatMoney(total.grab)),
      metric(t("boltTotal"), formatMoney(total.bolt)),
      metric(t("petrolTotal"), formatMoney(total.petrol)),
      metric(t("tngTotal"), formatMoney(total.tngCost)),
      metric(t("bankInTotal"), formatMoney(total.bankIn)),
      metric(t("walletPayoutTotal"), formatMoney(total.walletPayout))
    ].join("");
  }

  function renderMonthlyGoals(month, total) {
    const rentTarget = countSundaysInMonth(month) * WEEKLY_RENT_TARGET;
    const totalCommitment = MONTHLY_MORTGAGE_TARGET + rentTarget;
    const mortgageBalance = MONTHLY_MORTGAGE_TARGET - total.net;
    const totalBalance = totalCommitment - total.net;
    const weeklyMortgageShare = MONTHLY_MORTGAGE_TARGET / Math.max(countSundaysInMonth(month), 1);

    $("monthlyGoals").innerHTML = [
      goalCard(t("mortgageTarget"), formatMoney(MONTHLY_MORTGAGE_TARGET), `${t("balance")}: ${formatMoney(Math.max(mortgageBalance, 0))}`, "mortgage"),
      goalCard(t("carRentTarget"), formatMoney(rentTarget), `${countSundaysInMonth(month)} ${t("sundays")} x RM390`, "rent"),
      goalCard(t("monthlyCommitment"), formatMoney(totalCommitment), `${t("balance")}: ${formatMoney(Math.max(totalBalance, 0))}`, goalStatusClass(totalBalance)),
      goalCard(t("suggestedWeekly"), formatMoney(weeklyTargetForMonth(month)), t("rentMortgage"), "target")
    ].join("");
  }

  function renderRecordPicker() {
    const byDate = new Map(state.records.map((record) => [record.date, record]));
    const dates = [];
    const earliest = state.records.length
      ? state.records.reduce((min, record) => record.date < min ? record.date : min, state.records[0].date)
      : today;
    let date = parseDate(earliest);
    const end = today > earliest ? today : earliest;
    while (dateKey(date) <= end) {
      dates.push(dateKey(date));
      date.setDate(date.getDate() + 1);
    }
    dates.reverse();
    $("recordPicker").innerHTML = `<option value="">${t("editPast")}</option>` + dates.map((dateText) => {
      const record = byDate.get(dateText);
      if (!record) {
        const label = currentLanguage === "zh" ? "未填写" : "empty";
        return `<option value="date:${dateText}">${escapeHtml(dateText)} - ${label}</option>`;
      }
      const totals = calculate(record);
      return `<option value="${record.id}">${escapeHtml(record.date)} - ${formatMoney(totals.net)}</option>`;
    }).join("");
    if (editingId) $("recordPicker").value = editingId;
  }

  function tableHtml(title, headers, rows) {
    return `
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function exportExcel() {
    const records = [...state.records].sort((a, b) => a.date.localeCompare(b.date));
    const dailyRows = records.map((record) => {
      const totals = calculate(record);
      const recordsToDate = records.filter((item) => item.date <= record.date);
      const movementsToDate = state.movements.filter((movement) => movement.date <= record.date);
      const cumulative = grandTotals(recordsToDate, movementsToDate);
      return [
        record.date,
        record.status || "",
        record.startTime,
        record.endTime,
        record.secondStartTime,
        record.secondEndTime,
        record.platformMode,
        record.jobs,
        record.tngEwalletStart,
        record.tngEwalletEnd,
        record.tngCardStart,
        record.tngCardEnd,
        record.grabCashWalletStart,
        record.grabCashWalletEnd,
        record.grabCreditWalletStart,
        record.grabCreditWalletEnd,
        record.boltWalletStart,
        record.boltWalletEnd,
        record.grabWallet,
        record.boltWallet,
        record.totalCashCollected,
        record.totalTngCollected,
        record.grabRefund,
        record.extraBonus,
        record.extraCost,
        record.extraNotes,
        record.petrolCost,
        record.tngCost,
        totals.insuranceCost.toFixed(2),
        record.otherCost,
        totals.hours.toFixed(2),
        totals.grabSales.toFixed(2),
        totals.boltSales.toFixed(2),
        totals.totalSales.toFixed(2),
        totals.totalCost.toFixed(2),
        totals.net.toFixed(2),
        totals.hourly.toFixed(2),
        cumulative.grab.toFixed(2),
        cumulative.bolt.toFixed(2),
        cumulative.refund.toFixed(2),
        cumulative.sales.toFixed(2),
        cumulative.cost.toFixed(2),
        cumulative.net.toFixed(2),
        cumulative.bankIn ? cumulative.bankIn.toFixed(2) : "0.00",
        cumulative.walletPayout ? cumulative.walletPayout.toFixed(2) : "0.00",
        cumulative.cashWithdraw ? cumulative.cashWithdraw.toFixed(2) : "0.00",
        cumulative.banked.toFixed(2),
        cumulative.cashBalance.toFixed(2),
        WEEKLY_RENT_TARGET.toFixed(2),
        MONTHLY_MORTGAGE_TARGET.toFixed(2),
        weeklyTargetForMonth(record.date.slice(0, 7)).toFixed(2),
        record.notes
      ];
    });
    const movementRows = state.movements.map((movement) => [
      movement.date,
      movementLabel(movement.type),
      Number(movement.amount || 0).toFixed(2),
      movement.notes
    ]);
    const total = grandTotals(records, state.movements);
    const workbookHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #0f5132; }
            h2 { margin-top: 24px; color: #0f5132; }
            table { border-collapse: collapse; margin-bottom: 24px; }
            th { background: #0f5132; color: #ffffff; font-weight: bold; }
            th, td { border: 1px solid #b7c8bf; padding: 8px; white-space: nowrap; }
          </style>
        </head>
        <body>
          <h1>Driver Daily Closing Tracker</h1>
          ${tableHtml("Grand Total Summary", ["Item", "Amount"], [
            ["Grand Total Sales", total.sales.toFixed(2)],
            ["Grand Total Cost", total.cost.toFixed(2)],
            ["Net Income", total.net.toFixed(2)],
            ["Grand Total Sales by Grab", total.grab.toFixed(2)],
            ["Grand Total Sales by Bolt", total.bolt.toFixed(2)],
            ["Grand Total Refund", total.refund.toFixed(2)],
            ["Total Withdraw", (total.cashWithdraw || 0).toFixed(2)],
            ["Total Wallet Paid", (total.walletPayout || 0).toFixed(2)],
            ["Current Cash Balance", total.cashBalance.toFixed(2)],
            ["Current Banked In Amount", total.banked.toFixed(2)]
          ])}
          ${tableHtml("Daily Records", [
            "Date", "Status", "Start", "End", "Second Start", "Second End", "Platform", "Jobs",
            "TNG E-Wallet Start", "TNG E-Wallet End", "Smart Tag Start", "Smart Tag End",
            "Grab Cash Wallet Start", "Grab Cash Wallet End", "Grab Credit Wallet Start", "Grab Credit Wallet End",
            "Bolt Wallet Start", "Bolt Wallet End", "Grab Wallet Profit/Loss", "Bolt Wallet Profit/Loss",
            "Cash Collected Total", "TNG E-Wallet Collected Total", "Grab Refund",
            "Extra Bonus", "Extra Cost", "Extra Notes", "Petrol", "SmartTAG / Toll Cost", "Insurance",
            "Other Cost", "Hours", "Grab Sales Today", "Bolt Sales Today", "Total Sales Today", "Total Cost Today",
            "Net Income Today", "Net Per Hour Today", "Cumulative Grab Sales", "Cumulative Bolt Sales",
            "Cumulative Refund", "Cumulative Total Sales", "Cumulative Total Cost", "Cumulative Net Income",
            "Cumulative Bank In", "Cumulative Wallet Payout", "Cumulative Cash Withdraw",
            "Cumulative Banked In", "Current Cash Balance", "Weekly Rent Target", "Monthly Mortgage Target",
            "Suggested Weekly Net Target", "Notes"
          ], dailyRows)}
          ${tableHtml("Cash Movements", ["Date", "Type", "Amount", "Notes"], movementRows)}
          ${tableHtml("Commitment Targets", ["Target", "Amount"], [
            ["Weekly car rent", WEEKLY_RENT_TARGET.toFixed(2)],
            ["Monthly mortgage", MONTHLY_MORTGAGE_TARGET.toFixed(2)]
          ])}
        </body>
      </html>
    `;
    const blob = new Blob([workbookHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `driver-closing-${today}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function renderAll() {
    renderIncomeOverview();
    renderRecordPicker();
    renderDashboard();
    renderWeekAlert();
    renderMovements();
    renderComparison();
    renderMonthly();
    refreshLiveTotals();
  }

  function initEvents() {
    fields.forEach((field) => $(field).addEventListener("input", () => {
      refreshLiveTotals();
      autoSaveDraft();
    }));
    balanceFields.forEach((field) => $(field).addEventListener("input", applyBalanceDifferences));
    $("dailyForm").addEventListener("submit", saveDailyRecord);
    $("newRecordBtn").addEventListener("click", resetDailyForm);
    $("duplicateBtn").addEventListener("click", duplicateYesterday);
    $("applyBalancesBtn").addEventListener("click", applyBalanceDifferences);
    $("deleteRecordBtn").addEventListener("click", deleteDailyRecord);
    $("endDayBtn").addEventListener("click", endToday);
    $("exportExcelBtn").addEventListener("click", exportExcel);
    $("authLoginBtn").addEventListener("click", loginWithPassword);
    $("authLogoutBtn").addEventListener("click", signOut);
    ["authUsername", "authPassword"].forEach((id) => $(id).addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        loginWithPassword();
      }
    }));
    $("languageToggleBtn").addEventListener("click", () => {
      currentLanguage = currentLanguage === "zh" ? "en" : "zh";
      localStorage.setItem(LANGUAGE_KEY, currentLanguage);
      applyLanguage();
    });
    $("monthFilter").addEventListener("input", renderMonthly);
    $("cashForm").addEventListener("submit", saveMovement);
    $("recordPicker").addEventListener("change", (event) => {
      if (event.target.value.startsWith("date:")) {
        const record = { ...dailyDefaults(), id: uid(), date: event.target.value.slice(5) };
        fillDailyForm(record);
        editingId = null;
        $("deleteRecordBtn").disabled = true;
        return;
      }
      const record = state.records.find((item) => item.id === event.target.value);
      if (record) fillDailyForm(record);
    });
    $("movementList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-movement]");
      if (!button) return;
      const movement = state.movements.find((item) => item.id === button.dataset.editMovement);
      if (!movement) return;
      editingMovementId = movement.id;
      $("movementDate").value = movement.date;
      $("movementType").value = movement.type;
      $("movementAmount").value = movement.amount;
      $("movementNotes").value = movement.notes || "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.querySelectorAll(".bottom-nav button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".bottom-nav button").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
        button.classList.add("active");
        $(`page-${button.dataset.page}`).classList.add("active");
        $("pageTitle").textContent = t(button.dataset.titleKey) || button.textContent;
      });
    });
  }

  $("date").value = today;
  $("movementDate").value = today;
  $("monthFilter").value = currentMonth;
  initEvents();
  applyLanguage();
  initSupabaseSync();
})();

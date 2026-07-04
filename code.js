/***************************************
 * Better Me - English Weekly Tracker
 * Container-bound Google Apps Script
 * No external APIs
 * Uses SpreadsheetApp.getActiveSpreadsheet()
 ***************************************/

const APP = {
  SHEETS: {
    TRACKER: 'Tracker',
    CONFIG: 'Config',
  },

  LEGACY_CONFIG_SHEETS: ['Habit_Config', 'Daily_Log', 'Settings'],

  TIMEZONE: 'Asia/Ho_Chi_Minh',
  INITIAL_DAYS: 90,
  ADD_DAYS: 30,
  TARGET_COMPLETION_RATE: 0.8,

  VISIBLE_LAST_COL: 16,

  HELPER: {
    START_COL: 27, // AA
    START_ROW: 2,
  },

  LAYOUT: {
    WEEK_START_ROW: 7,
    CALENDAR_START_ROW: 7,
    SELECTED_DAY_START_ROW: 16,
    MOTIVATION_START_ROW: 24,
    CHART_START_ROW: 31,
  },

  CONFIG_LAYOUT: {
    SETTINGS: { titleRow: 1, headerRow: 2, dataRow: 3, col: 1, width: 3 },
    HABITS: { titleRow: 1, headerRow: 2, dataRow: 3, col: 5, width: 6 },
    LOGS: { titleRow: 1, headerRow: 2, dataRow: 3, col: 12, width: 7 },
  },

  COLORS: {
    navy: '#0F172A',
    slate: '#1E293B',
    white: '#FFFFFF',
    text: '#111827',
    muted: '#64748B',
    border: '#E2E8F0',
    gray: '#F8FAFC',
    softGray: '#F1F5F9',
    green: '#DCFCE7',
    greenText: '#166534',
    yellow: '#FEF3C7',
    yellowText: '#92400E',
    red: '#FEE2E2',
    redText: '#991B1B',
  },

  PALETTES: [
    {
      name: 'Forest',
      primary: '#14532D',
      secondary: '#DCFCE7',
      accent: '#22C55E',
      soft: '#F0FDF4',
      text: '#14532D',
    },
    {
      name: 'Ocean',
      primary: '#0C4A6E',
      secondary: '#E0F2FE',
      accent: '#0284C7',
      soft: '#F0F9FF',
      text: '#075985',
    },
    {
      name: 'Lavender',
      primary: '#4C1D95',
      secondary: '#F3E8FF',
      accent: '#8B5CF6',
      soft: '#FAF5FF',
      text: '#581C87',
    },
    {
      name: 'Sunset',
      primary: '#7C2D12',
      secondary: '#FFEDD5',
      accent: '#F97316',
      soft: '#FFF7ED',
      text: '#9A3412',
    },
  ],
};

const DEFAULT_HABITS = [
  ['wake_up', 'Wake up on time', 'Discipline', 1, true, 'Wake up at the time you planned.'],
  ['english', 'Study English', 'Learning', 1, true, 'Spend focused time practicing English.'],
  ['coding', 'Code / project work', 'Work', 2, true, 'Build, code, practice, or move a project forward.'],
  ['exercise', 'Exercise / sports', 'Health', 1, true, 'Move your body, train, walk, stretch, or play sports.'],
  ['focus', 'Avoid wasting time', 'Discipline', 1, true, 'Stay focused and reduce distractions.'],
  ['clean', 'Clean up / personal discipline', 'Discipline', 1, true, 'Keep your space and personal discipline clean.'],
  ['review', 'End-of-day review', 'Reflection', 1, true, 'Reflect on the day and plan tomorrow.'],
];

const SETTINGS_HEADERS = ['setting', 'value', 'description'];
const HABIT_HEADERS = ['habit_key', 'habit_name', 'category', 'max_score', 'active', 'description'];
const LOG_HEADERS = ['timestamp', 'date', 'habit_key', 'value', 'score', 'source', 'note'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function setupWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const tracker = ss.getSheetByName(APP.SHEETS.TRACKER);
  const preservedData = readExistingTrackerData_(tracker);

  const configData = collectConfigData_(ss);
  setupConfigSheet_(ss, configData);

  ss.setSpreadsheetTimeZone(getConfigSetting_(configData, 'timezone', APP.TIMEZONE));

  deleteLegacyConfigSheets_(ss);
  buildTrackerSheet_(ss, preservedData, collectConfigData_(ss));
  orderSheets_(ss);

  ss.setActiveSheet(ss.getSheetByName(APP.SHEETS.TRACKER));
  SpreadsheetApp.flush();
}

function resetWorkbook() {
  /**
   * Safety lock:
   * Change this to YES_DELETE_AND_REBUILD only when you really want to clear and rebuild.
   */
  const RESET_CONFIRMATION = 'NO';

  if (RESET_CONFIRMATION !== 'YES_DELETE_AND_REBUILD') {
    SpreadsheetApp.getUi().alert(
      'Reset blocked',
      'Open Code.gs and change RESET_CONFIRMATION to YES_DELETE_AND_REBUILD first.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  [APP.SHEETS.TRACKER, APP.SHEETS.CONFIG].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) sheet.clear();
  });

  setupWorkbook();
}

function createMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Self Tracker')
    .addItem('Setup Workbook', 'setupWorkbook')
    .addItem('Rebuild Tracker', 'rebuildDashboard')
    .addItem('Show Today', 'showToday')
    .addItem('Add Next 30 Days', 'addNext30Days')
    .addToUi();
}

function onOpen() {
  createMenu();
}

function onEdit(e) {
  try {
    if (!e || !e.range) return;

    const sheetName = e.range.getSheet().getName();

    if (sheetName === APP.SHEETS.TRACKER) {
      syncTrackerFromVisibleWeek_();
      return;
    }

    if (sheetName === APP.SHEETS.CONFIG) {
      rebuildDashboard();
    }
  } catch (err) {
    // Keep the sheet usable even if an edit happens during a rebuild.
  }
}

function onSelectionChange(e) {
  try {
    if (!e || !e.range) return;

    const range = e.range;
    const sheet = range.getSheet();

    if (sheet.getName() !== APP.SHEETS.TRACKER) return;
    if (range.getNumRows() !== 1 || range.getNumColumns() !== 1) return;

    const note = range.getNote();
    if (!note || !note.startsWith('date:')) return;

    const selectedDate = parseIsoDate_(note.replace('date:', '').trim());
    if (!selectedDate) return;

    selectDate_(selectedDate);
  } catch (err) {
    // Selection change should never interrupt normal spreadsheet usage.
  }
}

function rebuildDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tracker = ss.getSheetByName(APP.SHEETS.TRACKER);
  const preservedData = readExistingTrackerData_(tracker);

  const configData = collectConfigData_(ss);
  setupConfigSheet_(ss, configData);
  ss.setSpreadsheetTimeZone(getConfigSetting_(configData, 'timezone', APP.TIMEZONE));

  buildTrackerSheet_(ss, preservedData, collectConfigData_(ss));
  orderSheets_(ss);

  ss.setActiveSheet(ss.getSheetByName(APP.SHEETS.TRACKER));
  SpreadsheetApp.flush();
}

function showToday() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setConfigSettingValue_(ss, 'selected_date', today_());
  rebuildDashboard();
}

function addNext30Days() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configData = collectConfigData_(ss);
  const currentDays = Number(getConfigSetting_(configData, 'tracker_days', APP.INITIAL_DAYS)) || APP.INITIAL_DAYS;

  setConfigSettingValue_(ss, 'tracker_days', currentDays + APP.ADD_DAYS);
  rebuildDashboard();
}

/* -----------------------------
 * Date selection
 * ----------------------------- */

function selectDate_(selectedDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tracker = ss.getSheetByName(APP.SHEETS.TRACKER);

  if (!tracker) return;

  const configBefore = collectConfigData_(ss);
  const preservedData = readExistingTrackerData_(tracker);
  const records = createRecords_(configBefore, preservedData);

  overlayVisibleWeekToRecords_(tracker, records, configBefore);
  calculateRecords_(records, configBefore);

  const updatedPreservedData = recordsToPreservedData_(records);

  setConfigSettingValue_(ss, 'selected_date', selectedDate);

  const configAfter = collectConfigData_(ss);
  buildTrackerSheet_(ss, updatedPreservedData, configAfter);
}

/* -----------------------------
 * Tracker builder
 * ----------------------------- */

function buildTrackerSheet_(ss, preservedData, configData) {
  const sheet = ensureSheet_(ss, APP.SHEETS.TRACKER);
  const schema = getHelperSchema_(configData.habits);
  const records = createRecords_(configData, preservedData);
  const selectedDate = getSelectedDate_(configData);
  const palette = paletteForDate_(selectedDate);

  resetSheet_(sheet);

  const requiredRows = Math.max(80, records.length + 5);
  const requiredCols = Math.max(72, schema.startCol + schema.length + 14);

  ensureSheetSize_(sheet, requiredRows, requiredCols);
  sheet.setHiddenGridlines(true);

  buildTopDashboardLayout_(sheet, selectedDate, palette);
  writeHelperData_(sheet, records, schema, configData.habits);
  buildSelectedWeekPanel_(sheet, records, configData, palette);
  buildMiniCalendar_(sheet, records, configData, palette);
  buildSelectedDayCard_(sheet, records, configData, palette);
  buildMotivationCard_(sheet, palette);

  const chartInfo = writeChartTables_(sheet, records, configData, schema);
  createCharts_(sheet, chartInfo, palette);

  refreshTopDashboard_(sheet, records, configData);
  refreshSelectedWeekSummaries_(sheet, records, configData, palette);
  refreshMiniCalendar_(sheet, records, configData, palette);
  refreshSelectedDayCard_(sheet, records, configData, palette);

  applyTrackerFormatting_(sheet);
  hideHelperColumns_(sheet, schema);

  sheet.setFrozenRows(2);
}

function buildTopDashboardLayout_(sheet, selectedDate, palette) {
  const selectedWeekStart = getWeekStart_(selectedDate);

  sheet.getRange(1, 1, 1, APP.VISIBLE_LAST_COL)
    .merge()
    .setValue('🦉 Better Me Tracker')
    .setFontSize(22)
    .setFontWeight('bold')
    .setFontColor(APP.COLORS.white)
    .setBackground(palette.primary)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.getRange(2, 1, 1, APP.VISIBLE_LAST_COL)
    .merge()
    .setValue(`Selected week • ${formatDateLabel_(selectedWeekStart)} → ${formatDateLabel_(addDays_(selectedWeekStart, 6))} • Theme: ${palette.name}`)
    .setFontSize(10)
    .setFontColor(APP.COLORS.white)
    .setBackground(APP.COLORS.slate)
    .setHorizontalAlignment('center');

  sheet.setRowHeight(1, 42);
  sheet.setRowHeight(2, 24);

  makeMetricCard_(sheet, 4, 1, 4, '🎯 Today Progress', palette);
  makeMetricCard_(sheet, 4, 5, 4, '📅 Selected Week', palette);
  makeMetricCard_(sheet, 4, 10, 3, '🧩 Missed', palette);
  makeMetricCard_(sheet, 4, 13, 4, '🔥 Current Streak', palette);
}

function makeMetricCard_(sheet, row, col, width, title, palette) {
  const titleRange = sheet.getRange(row, col, 1, width).merge();
  const valueRange = sheet.getRange(row + 1, col, 1, width).merge();

  titleRange
    .setValue(title)
    .setBackground(palette.secondary)
    .setFontColor(palette.text)
    .setFontWeight('bold')
    .setFontSize(9)
    .setHorizontalAlignment('center');

  valueRange
    .setValue('')
    .setBackground(APP.COLORS.white)
    .setFontColor(APP.COLORS.navy)
    .setFontWeight('bold')
    .setFontSize(16)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  applyBorders_(sheet.getRange(row, col, 2, width));
}

function refreshTopDashboard_(sheet, records, configData) {
  const map = recordsToMap_(records);
  const today = today_();
  const selectedDate = getSelectedDate_(configData);
  const selectedWeekStart = getWeekStart_(selectedDate);
  const selectedWeekEnd = addDays_(selectedWeekStart, 6);
  const startDate = getStartDate_(configData);

  const todayRecord = map[dateKey_(today)];

  let todayProgress = '0/0 • 0%';
  let currentStreak = 0;

  if (todayRecord && today >= startDate) {
    todayProgress = `${todayRecord.totalScore}/${todayRecord.maxScore} • ${percentText_(todayRecord.completionRate)}`;
    currentStreak = numberOrZero_(todayRecord.streak);
  }

  const selectedWeekRecords = records.filter(record =>
    record.date >= selectedWeekStart &&
    record.date <= selectedWeekEnd &&
    record.date >= startDate &&
    record.date <= today &&
    record.completionRate !== ''
  );

  const selectedWeekRate = average_(selectedWeekRecords.map(record => record.completionRate));
  const missedCount = selectedWeekRecords.reduce((sum, record) => sum + record.missedKeys.length, 0);

  sheet.getRange(5, 1).setValue(todayProgress);
  sheet.getRange(5, 5).setValue(percentText_(selectedWeekRate));
  sheet.getRange(5, 10).setValue(String(missedCount));
  sheet.getRange(5, 13).setValue(`${currentStreak} days`);
}

/* -----------------------------
 * Selected week panel
 * ----------------------------- */

function buildSelectedWeekPanel_(sheet, records, configData, palette) {
  const selectedDate = getSelectedDate_(configData);
  const selectedWeekStart = getWeekStart_(selectedDate);
  const row = APP.LAYOUT.WEEK_START_ROW;
  const visibleHabits = getVisibleHabits_(configData.habits);
  const recordsMap = recordsToMap_(records);
  const startDate = getStartDate_(configData);

  sheet.getRange(row, 1, 1, 8)
    .merge()
    .setValue('🗓️ Weekly Quest Board')
    .setBackground(palette.primary)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('left');

  const header = ['Daily Quest 🧩'];

  for (let i = 0; i < 7; i++) {
    const d = addDays_(selectedWeekStart, i);
    header.push(`${DAY_LABELS[i]}\n${formatDateLabel_(d)}`);
  }

  sheet.getRange(row + 1, 1, 1, 8)
    .setValues([header])
    .setWrap(true)
    .setBackground(APP.COLORS.slate)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  const habitStartRow = getHabitStartRow_();

  visibleHabits.forEach((habit, habitIndex) => {
    const habitRow = habitStartRow + habitIndex;

    sheet.getRange(habitRow, 1)
      .setValue(`${iconForHabit_(habit.key, habit.category)} ${habit.name}`)
      .setFontWeight('bold')
      .setWrap(true)
      .setVerticalAlignment('middle')
      .setBackground(habitIndex % 2 === 0 ? APP.COLORS.white : APP.COLORS.gray);

    for (let day = 0; day < 7; day++) {
      const date = addDays_(selectedWeekStart, day);
      const record = recordsMap[dateKey_(date)];
      const cell = sheet.getRange(habitRow, day + 2);
      const isSelectedDay = dateKey_(date) === dateKey_(selectedDate);
      const bg = isSelectedDay ? palette.secondary : (habitIndex % 2 === 0 ? APP.COLORS.white : APP.COLORS.gray);

      cell
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');

      if (date < startDate) {
        cell
          .clearDataValidations()
          .setValue('')
          .setBackground('#F8FAFC');
      } else {
        cell
          .insertCheckboxes()
          .setValue(Boolean(record && record.habits[habit.key]))
          .setBackground(bg);
      }
    }
  });

  const scoreRow = getScoreRow_(visibleHabits);
  const rateRow = scoreRow + 1;
  const statusRow = scoreRow + 2;
  const noteRow = scoreRow + 4;
  const challengeRow = noteRow + 1;
  const focusRow = noteRow + 2;

  sheet.getRange(scoreRow, 1).setValue('🎯 Score');
  sheet.getRange(rateRow, 1).setValue('📈 Progress');
  sheet.getRange(statusRow, 1).setValue('🌈 Status');

  [scoreRow, rateRow, statusRow].forEach(r => {
    sheet.getRange(r, 1, 1, 8)
      .setFontWeight('bold')
      .setBackground(palette.soft)
      .setVerticalAlignment('middle');
  });

  buildNoteRow_(sheet, noteRow, '📝 Note', 'daily_note', selectedWeekStart, recordsMap, selectedDate, palette);
  buildNoteRow_(sheet, challengeRow, '⚠️ Challenge', 'problem_today', selectedWeekStart, recordsMap, selectedDate, palette);
  buildNoteRow_(sheet, focusRow, '🎯 Next Focus', 'tomorrow_focus', selectedWeekStart, recordsMap, selectedDate, palette);

  applyBorders_(sheet.getRange(row, 1, focusRow - row + 1, 8));

  sheet.setRowHeight(row + 1, 42);
  for (let r = habitStartRow; r <= statusRow; r++) sheet.setRowHeight(r, 30);
  for (let r = noteRow; r <= focusRow; r++) sheet.setRowHeight(r, 44);
}

function buildNoteRow_(sheet, row, label, key, weekStart, recordsMap, selectedDate, palette) {
  sheet.getRange(row, 1)
    .setValue(label)
    .setFontWeight('bold')
    .setBackground(APP.COLORS.softGray)
    .setVerticalAlignment('middle');

  for (let day = 0; day < 7; day++) {
    const date = addDays_(weekStart, day);
    const record = recordsMap[dateKey_(date)];
    const value = record ? record[key] : '';
    const isSelectedDay = dateKey_(date) === dateKey_(selectedDate);

    sheet.getRange(row, day + 2)
      .setValue(value || '')
      .setWrap(true)
      .setFontSize(8)
      .setBackground(isSelectedDay ? palette.secondary : APP.COLORS.softGray)
      .setVerticalAlignment('top');
  }
}

function refreshSelectedWeekSummaries_(sheet, records, configData, palette) {
  const visibleHabits = getVisibleHabits_(configData.habits);
  const recordsMap = recordsToMap_(records);
  const selectedDate = getSelectedDate_(configData);
  const selectedWeekStart = getWeekStart_(selectedDate);
  const today = today_();
  const startDate = getStartDate_(configData);

  const scoreRow = getScoreRow_(visibleHabits);
  const rateRow = scoreRow + 1;
  const statusRow = scoreRow + 2;

  const scoreValues = [];
  const rateValues = [];
  const statusValues = [];

  const scoreBgs = [];
  const rateBgs = [];
  const statusBgs = [];

  for (let day = 0; day < 7; day++) {
    const date = addDays_(selectedWeekStart, day);
    const record = recordsMap[dateKey_(date)];
    const isSelectedDay = dateKey_(date) === dateKey_(selectedDate);

    if (!record || date < startDate) {
      scoreValues.push('—');
      rateValues.push('');
      statusValues.push('');
      scoreBgs.push('#F8FAFC');
      rateBgs.push('#F8FAFC');
      statusBgs.push('#F8FAFC');
      continue;
    }

    if (date > today) {
      scoreValues.push('—');
      rateValues.push('');
      statusValues.push('🌱 Planned');
      scoreBgs.push(isSelectedDay ? palette.secondary : palette.soft);
      rateBgs.push(isSelectedDay ? palette.secondary : palette.soft);
      statusBgs.push(APP.COLORS.softGray);
      continue;
    }

    scoreValues.push(`${record.totalScore}/${record.maxScore}`);
    rateValues.push(record.completionRate);
    statusValues.push(statusWithEmoji_(record.status));

    const bg = colorForStatus_(record.status);

    scoreBgs.push(isSelectedDay ? palette.secondary : bg);
    rateBgs.push(isSelectedDay ? palette.secondary : bg);
    statusBgs.push(isSelectedDay ? palette.secondary : bg);
  }

  sheet.getRange(scoreRow, 2, 1, 7)
    .setValues([scoreValues])
    .setBackgrounds([scoreBgs])
    .setHorizontalAlignment('center')
    .setFontWeight('bold');

  sheet.getRange(rateRow, 2, 1, 7)
    .setValues([rateValues])
    .setNumberFormat('0%')
    .setBackgrounds([rateBgs])
    .setHorizontalAlignment('center')
    .setFontWeight('bold');

  sheet.getRange(statusRow, 2, 1, 7)
    .setValues([statusValues])
    .setBackgrounds([statusBgs])
    .setHorizontalAlignment('center')
    .setFontWeight('bold');
}

/* -----------------------------
 * Calendar and right panel
 * ----------------------------- */

function buildMiniCalendar_(sheet, records, configData, palette) {
  const startRow = APP.LAYOUT.CALENDAR_START_ROW;
  const startCol = 10;
  const selectedDate = getSelectedDate_(configData);

  sheet.getRange(startRow, startCol, 1, 7)
    .merge()
    .setValue(`📅 ${Utilities.formatDate(selectedDate, APP.TIMEZONE, 'MMMM yyyy')}`)
    .setBackground(palette.primary)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(startRow + 1, startCol, 1, 7)
    .setValues([DAY_LABELS])
    .setBackground(APP.COLORS.slate)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  applyBorders_(sheet.getRange(startRow, startCol, 8, 7));
  refreshMiniCalendar_(sheet, records, configData, palette);
}

function refreshMiniCalendar_(sheet, records, configData, palette) {
  const startRow = APP.LAYOUT.CALENDAR_START_ROW;
  const startCol = 10;
  const selectedDate = getSelectedDate_(configData);
  const today = today_();

  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const gridStart = getWeekStart_(monthStart);
  const recordsMap = recordsToMap_(records);
  const startDate = getStartDate_(configData);

  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const date = addDays_(gridStart, week * 7 + day);
      const record = recordsMap[dateKey_(date)];
      const cell = sheet.getRange(startRow + 2 + week, startCol + day);

      let label = String(date.getDate());

      if (record && date >= startDate && date <= today && record.completionRate !== '') {
        label += '\n' + percentText_(record.completionRate);
      }

      cell
        .setValue(label)
        .setNote('date:' + dateKey_(date))
        .setWrap(true)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setFontSize(8)
        .setFontWeight('normal');

      if (date.getMonth() !== selectedDate.getMonth()) {
        cell.setBackground('#F8FAFC').setFontColor('#CBD5E1');
      } else if (dateKey_(date) === dateKey_(selectedDate)) {
        cell.setBackground(palette.secondary).setFontColor(palette.text).setFontWeight('bold');
      } else if (record && date >= startDate && date <= today) {
        cell.setBackground(colorForStatus_(record.status)).setFontColor(textColorForStatus_(record.status));
      } else {
        cell.setBackground(APP.COLORS.white).setFontColor(APP.COLORS.text);
      }

      if (dateKey_(date) === dateKey_(today)) {
        cell.setFontColor('#2563EB').setFontWeight('bold');
      }
    }

    sheet.setRowHeight(startRow + 2 + week, 38);
  }
}

function buildSelectedDayCard_(sheet, records, configData, palette) {
  const row = APP.LAYOUT.SELECTED_DAY_START_ROW;
  const col = 10;

  sheet.getRange(row, col, 1, 7)
    .merge()
    .setValue('🔎 Selected Day')
    .setBackground(palette.primary)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(row + 1, col, 7, 7)
    .setBackground(APP.COLORS.white);

  applyBorders_(sheet.getRange(row, col, 8, 7));
}

function refreshSelectedDayCard_(sheet, records, configData, palette) {
  const row = APP.LAYOUT.SELECTED_DAY_START_ROW;
  const col = 10;
  const selectedDate = getSelectedDate_(configData);
  const recordsMap = recordsToMap_(records);
  const record = recordsMap[dateKey_(selectedDate)];
  const today = today_();

  let headline = `${formatLongDate_(selectedDate)}`;
  let progress = 'Not tracked yet';
  let missed = 'No data yet.';
  let note = 'No note yet. Write one in the Note row of the weekly board.';

  if (record) {
    if (selectedDate > today) {
      progress = 'Planned day';
      missed = 'Future day. You can prepare notes in advance.';
    } else if (record.completionRate !== '') {
      progress = `${record.totalScore}/${record.maxScore} • ${percentText_(record.completionRate)} • ${record.status}`;
      missed = record.missedNames.length
        ? record.missedNames.join(', ')
        : 'Nothing missed. Owl approves. 🦉';
    }

    if (record.daily_note) {
      note = record.daily_note;
    }
  }

  sheet.getRange(row + 1, col, 1, 7)
    .merge()
    .setValue(headline)
    .setBackground(palette.secondary)
    .setFontColor(palette.text)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(row + 2, col, 1, 7)
    .merge()
    .setValue(progress)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(row + 3, col, 1, 7)
    .merge()
    .setValue('Missed quests')
    .setBackground(APP.COLORS.softGray)
    .setFontColor(APP.COLORS.muted)
    .setFontWeight('bold');

  sheet.getRange(row + 4, col, 1, 7)
    .merge()
    .setValue(missed)
    .setWrap(true)
    .setVerticalAlignment('top');

  sheet.getRange(row + 5, col, 1, 7)
    .merge()
    .setValue('Note')
    .setBackground(APP.COLORS.softGray)
    .setFontColor(APP.COLORS.muted)
    .setFontWeight('bold');

  sheet.getRange(row + 6, col, 2, 7)
    .merge()
    .setValue(note)
    .setWrap(true)
    .setVerticalAlignment('top')
    .setBackground(palette.soft);

  sheet.setRowHeight(row + 4, 44);
  sheet.setRowHeight(row + 6, 42);
  sheet.setRowHeight(row + 7, 42);
}

function buildMotivationCard_(sheet, palette) {
  const row = APP.LAYOUT.MOTIVATION_START_ROW;
  const col = 10;

  const messages = [
    'Small wins compound. Check one box, then another.',
    'Do the minimum version if energy is low. Keeping the chain alive matters.',
    'Discipline is not pressure. It is long-term kindness to yourself.',
    'Do not wait for motivation. Start tiny; motivation usually arrives late.',
    'A missed day is feedback, not identity.',
    'Today does not need to be perfect. It needs to be honest.',
    'The owl does not judge. The owl tracks. 🦉',
  ];

  const startOfYear = new Date(today_().getFullYear(), 0, 1);
  const index = Math.floor((today_() - startOfYear) / 86400000) % messages.length;

  sheet.getRange(row, col, 1, 7)
    .merge()
    .setValue('🦉 Daily Boost')
    .setBackground(palette.primary)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(row + 1, col, 4, 7)
    .merge()
    .setValue(messages[index])
    .setWrap(true)
    .setFontSize(11)
    .setFontColor(APP.COLORS.text)
    .setBackground(palette.soft)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  applyBorders_(sheet.getRange(row, col, 5, 7));
}

/* -----------------------------
 * Sync after edit
 * ----------------------------- */

function syncTrackerFromVisibleWeek_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.TRACKER);
  if (!sheet) return;

  const configData = collectConfigData_(ss);
  const preservedData = readExistingTrackerData_(sheet);
  const records = createRecords_(configData, preservedData);
  const palette = paletteForDate_(getSelectedDate_(configData));
  const schema = getHelperSchema_(configData.habits);

  overlayVisibleWeekToRecords_(sheet, records, configData);
  calculateRecords_(records, configData);

  writeHelperData_(sheet, records, schema, configData.habits);
  refreshTopDashboard_(sheet, records, configData);
  refreshSelectedWeekSummaries_(sheet, records, configData, palette);
  refreshMiniCalendar_(sheet, records, configData, palette);
  refreshSelectedDayCard_(sheet, records, configData, palette);
  writeChartTables_(sheet, records, configData, schema);
}

function overlayVisibleWeekToRecords_(sheet, records, configData) {
  const visibleHabits = getVisibleHabits_(configData.habits);
  const recordsMap = recordsToMap_(records);
  const selectedDate = getSelectedDate_(configData);
  const selectedWeekStart = getWeekStart_(selectedDate);
  const startDate = getStartDate_(configData);

  const habitStartRow = getHabitStartRow_();

  for (let day = 0; day < 7; day++) {
    const date = addDays_(selectedWeekStart, day);
    const record = recordsMap[dateKey_(date)];

    if (!record || date < startDate) continue;

    visibleHabits.forEach((habit, habitIndex) => {
      const value = sheet.getRange(habitStartRow + habitIndex, day + 2).getValue();
      record.habits[habit.key] = value === true;
    });
  }

  const scoreRow = getScoreRow_(visibleHabits);
  const noteRow = scoreRow + 4;
  const challengeRow = noteRow + 1;
  const focusRow = noteRow + 2;

  for (let day = 0; day < 7; day++) {
    const date = addDays_(selectedWeekStart, day);
    const record = recordsMap[dateKey_(date)];

    if (!record || date < startDate) continue;

    record.daily_note = normalizeTextValue_(sheet.getRange(noteRow, day + 2).getValue());
    record.problem_today = normalizeTextValue_(sheet.getRange(challengeRow, day + 2).getValue());
    record.tomorrow_focus = normalizeTextValue_(sheet.getRange(focusRow, day + 2).getValue());
  }
}

/* -----------------------------
 * Helper data and charts
 * ----------------------------- */

function writeHelperData_(sheet, records, schema, habits) {
  const headers = schema.headers;

  const rows = records.map(record => {
    const row = [
      record.date,
      record.weekStart,
      record.dayLabel,
    ];

    habits.forEach(habit => {
      row.push(Boolean(record.habits[habit.key]));
    });

    row.push(record.daily_note || '');
    row.push(record.problem_today || '');
    row.push(record.tomorrow_focus || '');
    row.push(record.totalScore);
    row.push(record.maxScore);
    row.push(record.completionRate);
    row.push(record.status);
    row.push(record.streak);

    return row;
  });

  const clearRows = Math.max(sheet.getLastRow(), rows.length + 1);

  sheet.getRange(1, schema.startCol, clearRows, schema.length).clearContent();
  sheet.getRange(1, schema.startCol, 1, headers.length).setValues([headers]);

  if (rows.length) {
    sheet.getRange(APP.HELPER.START_ROW, schema.startCol, rows.length, headers.length).setValues(rows);
  }

  sheet.getRange(APP.HELPER.START_ROW, schema.colByName.date, Math.max(rows.length, 1), 2).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(APP.HELPER.START_ROW, schema.colByName.completion_rate, Math.max(rows.length, 1), 1).setNumberFormat('0%');
}

function writeChartTables_(sheet, records, configData, schema) {
  const selectedDate = getSelectedDate_(configData);
  const palette = paletteForDate_(selectedDate);

  const dailyCol = schema.startCol + schema.length + 3;
  const habitCol = dailyCol + 3;

  sheet.getRange(1, dailyCol, 90, 8).clearContent();

  sheet.getRange(1, dailyCol, 1, 2)
    .setValues([['Date', 'Completion']])
    .setBackground(APP.COLORS.slate)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold');

  const recordsMap = recordsToMap_(records);
  const startDate = getStartDate_(configData);
  const chartAnchor = minDate_(selectedDate, today_());

  const dailyRows = [];

  for (let i = 29; i >= 0; i--) {
    const date = addDays_(chartAnchor, -i);
    const record = recordsMap[dateKey_(date)];
    const rate = record && date >= startDate && record.completionRate !== '' ? record.completionRate : '';

    dailyRows.push([date, rate]);
  }

  sheet.getRange(2, dailyCol, dailyRows.length, 2).setValues(dailyRows);
  sheet.getRange(2, dailyCol, dailyRows.length, 1).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(2, dailyCol + 1, dailyRows.length, 1).setNumberFormat('0%');

  sheet.getRange(1, habitCol, 1, 2)
    .setValues([['Habit', 'Selected Week']])
    .setBackground(APP.COLORS.slate)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold');

  const visibleHabits = getVisibleHabits_(configData.habits);
  const selectedWeekStart = getWeekStart_(selectedDate);
  const selectedWeekEnd = addDays_(selectedWeekStart, 6);
  const today = today_();

  const weekRecords = records.filter(record =>
    record.date >= selectedWeekStart &&
    record.date <= selectedWeekEnd &&
    record.date >= startDate &&
    record.date <= today
  );

  const habitRows = visibleHabits.map(habit => {
    const denominator = weekRecords.length;
    const completed = weekRecords.filter(record => record.habits[habit.key] === true).length;
    const rate = denominator ? completed / denominator : 0;

    return [`${iconForHabit_(habit.key, habit.category)} ${habit.name}`, rate];
  });

  if (habitRows.length) {
    sheet.getRange(2, habitCol, habitRows.length, 2).setValues(habitRows);
    sheet.getRange(2, habitCol + 1, habitRows.length, 1).setNumberFormat('0%');
  }

  sheet.setColumnWidth(dailyCol, 110);
  sheet.setColumnWidth(dailyCol + 1, 110);
  sheet.setColumnWidth(habitCol, 210);
  sheet.setColumnWidth(habitCol + 1, 110);

  return {
    dailyRange: sheet.getRange(1, dailyCol, 31, 2),
    habitRange: sheet.getRange(1, habitCol, Math.max(habitRows.length + 1, 2), 2),
    palette,
  };
}

function createCharts_(sheet, chartInfo, palette) {
  sheet.getCharts().forEach(chart => sheet.removeChart(chart));

  try {
    const lineChart = sheet.newChart()
      .setChartType(Charts.ChartType.LINE)
      .addRange(chartInfo.dailyRange)
      .setPosition(APP.LAYOUT.CHART_START_ROW, 1, 0, 0)
      .setOption('title', '📈 30-Day Progress')
      .setOption('legend', { position: 'none' })
      .setOption('height', 260)
      .setOption('width', 620)
      .setOption('colors', [palette.accent])
      .setOption('vAxis', {
        format: 'percent',
        viewWindow: { min: 0, max: 1 },
      })
      .build();

    sheet.insertChart(lineChart);

    const habitChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(chartInfo.habitRange)
      .setPosition(APP.LAYOUT.CHART_START_ROW, 10, 0, 0)
      .setOption('title', '🧩 Selected Week Habits')
      .setOption('legend', { position: 'none' })
      .setOption('height', 260)
      .setOption('width', 520)
      .setOption('colors', [palette.accent])
      .setOption('vAxis', {
        format: 'percent',
        viewWindow: { min: 0, max: 1 },
      })
      .build();

    sheet.insertChart(habitChart);
  } catch (err) {
    sheet.getRange(APP.LAYOUT.CHART_START_ROW, 1).setValue('Charts could not be created automatically.');
  }
}

/* -----------------------------
 * Config sheet
 * ----------------------------- */

function collectConfigData_(ss) {
  const settingsMap = {};
  const settingsOrder = [];

  mergeSettingsRows_(settingsMap, settingsOrder, getDefaultSettingsRows_());

  const habitMap = {};
  const habitOrder = [];

  mergeHabitRows_(habitMap, habitOrder, DEFAULT_HABITS);

  const legacySettings = ss.getSheetByName('Settings');
  if (legacySettings) {
    mergeSettingsRows_(settingsMap, settingsOrder, readRows_(legacySettings, 2, 1, 3, 0));
  }

  const legacyHabits = ss.getSheetByName('Habit_Config');
  if (legacyHabits) {
    mergeHabitRows_(habitMap, habitOrder, readRows_(legacyHabits, 2, 1, 6, 0));
  }

  const legacyLogSheet = ss.getSheetByName('Daily_Log');
  const legacyLogs = legacyLogSheet ? readLogRows_(legacyLogSheet, 2, 1, 7) : [];

  const configSheet = ss.getSheetByName(APP.SHEETS.CONFIG);
  let configLogs = [];

  if (configSheet) {
    const L = APP.CONFIG_LAYOUT;

    mergeSettingsRows_(settingsMap, settingsOrder, readRows_(configSheet, L.SETTINGS.dataRow, L.SETTINGS.col, L.SETTINGS.width, 0));
    mergeHabitRows_(habitMap, habitOrder, readRows_(configSheet, L.HABITS.dataRow, L.HABITS.col, L.HABITS.width, 0));

    configLogs = readLogRows_(configSheet, L.LOGS.dataRow, L.LOGS.col, L.LOGS.width);
  }

  const settingsRows = settingsOrder.map(key => {
    const defaultRow = getDefaultSettingsRows_().find(row => row[0] === key);
    const item = settingsMap[key];

    return [
      key,
      item.value,
      defaultRow ? defaultRow[2] : item.description || '',
    ];
  });

  const habits = habitOrder.map(key => habitMap[key]);
  const habitRows = habits.map(habit => [
    habit.key,
    habit.name,
    habit.category,
    habit.maxScore,
    habit.active,
    habit.description,
  ]);

  return {
    settingsRows,
    settingsMap,
    habits,
    habitRows,
    logs: configLogs.length ? configLogs : legacyLogs,
  };
}

function setupConfigSheet_(ss, configData) {
  const sheet = ensureSheet_(ss, APP.SHEETS.CONFIG);
  const L = APP.CONFIG_LAYOUT;

  resetSheet_(sheet);
  ensureSheetSize_(sheet, 120, 20);
  sheet.setHiddenGridlines(true);

  buildConfigSection_(sheet, L.SETTINGS, '⚙️ Settings', SETTINGS_HEADERS, configData.settingsRows);
  buildConfigSection_(sheet, L.HABITS, '🧩 Habit Config', HABIT_HEADERS, configData.habitRows);
  buildConfigSection_(sheet, L.LOGS, '📦 Daily Log', LOG_HEADERS, configData.logs);

  sheet.setFrozenRows(2);

  sheet.setColumnWidths(1, 1, 190);
  sheet.setColumnWidths(2, 1, 170);
  sheet.setColumnWidths(3, 1, 340);

  sheet.setColumnWidths(5, 1, 130);
  sheet.setColumnWidths(6, 1, 220);
  sheet.setColumnWidths(7, 1, 130);
  sheet.setColumnWidths(8, 1, 100);
  sheet.setColumnWidths(9, 1, 80);
  sheet.setColumnWidths(10, 1, 360);

  sheet.setColumnWidths(12, 1, 180);
  sheet.setColumnWidths(13, 1, 120);
  sheet.setColumnWidths(14, 1, 140);
  sheet.setColumnWidths(15, 1, 80);
  sheet.setColumnWidths(16, 1, 80);
  sheet.setColumnWidths(17, 1, 120);
  sheet.setColumnWidths(18, 1, 320);

  const settingsCount = Math.max(configData.settingsRows.length, 1);
  sheet.getRange(L.SETTINGS.dataRow, L.SETTINGS.col + 1, settingsCount, 1).setBackground('#EFF6FF');

  ['start_date', 'selected_date'].forEach(key => {
    const row = findConfigSettingRow_(sheet, key);
    if (row) sheet.getRange(row, L.SETTINGS.col + 1).setNumberFormat('yyyy-mm-dd');
  });

  const targetRow = findConfigSettingRow_(sheet, 'target_completion_rate');
  if (targetRow) sheet.getRange(targetRow, L.SETTINGS.col + 1).setNumberFormat('0%');

  const habitCount = Math.max(configData.habitRows.length, 1);
  const activeRange = sheet.getRange(L.HABITS.dataRow, L.HABITS.col + 4, habitCount, 1);

  activeRange.insertCheckboxes();
  activeRange.setValues(configData.habitRows.map(row => [row[4] === true || String(row[4]).toUpperCase() === 'TRUE']));

  sheet.getRange(L.HABITS.dataRow, L.HABITS.col, habitCount, L.HABITS.width).setWrap(true);

  sheet.getRange(L.LOGS.dataRow, L.LOGS.col, Math.max(configData.logs.length, 1), 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange(L.LOGS.dataRow, L.LOGS.col + 1, Math.max(configData.logs.length, 1), 1).setNumberFormat('yyyy-mm-dd');
}

function buildConfigSection_(sheet, layout, title, headers, rows) {
  sheet.getRange(layout.titleRow, layout.col, 1, layout.width)
    .merge()
    .setValue(title)
    .setBackground(APP.COLORS.navy)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(layout.headerRow, layout.col, 1, layout.width)
    .setValues([headers])
    .setBackground(APP.COLORS.slate)
    .setFontColor(APP.COLORS.white)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  if (rows && rows.length) {
    sheet.getRange(layout.dataRow, layout.col, rows.length, layout.width).setValues(rows);
  }

  const borderRows = Math.max((rows ? rows.length : 0) + 2, 4);
  applyBorders_(sheet.getRange(layout.titleRow, layout.col, borderRows, layout.width));
}

function deleteLegacyConfigSheets_(ss) {
  APP.LEGACY_CONFIG_SHEETS.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && ss.getSheets().length > 2) {
      ss.deleteSheet(sheet);
    }
  });
}

function setConfigSettingValue_(ss, key, value) {
  const sheet = ensureSheet_(ss, APP.SHEETS.CONFIG);
  const L = APP.CONFIG_LAYOUT.SETTINGS;
  const row = findConfigSettingRow_(sheet, key);

  if (row) {
    sheet.getRange(row, L.col + 1).setValue(value);
    return;
  }

  const nextRow = Math.max(sheet.getLastRow() + 1, L.dataRow);
  sheet.getRange(nextRow, L.col, 1, 3).setValues([[key, value, '']]);
}

function findConfigSettingRow_(sheet, key) {
  const L = APP.CONFIG_LAYOUT.SETTINGS;
  const lastRow = sheet.getLastRow();

  if (lastRow < L.dataRow) return null;

  const values = sheet.getRange(L.dataRow, L.col, lastRow - L.dataRow + 1, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === key) {
      return L.dataRow + i;
    }
  }

  return null;
}

/* -----------------------------
 * Records and calculation
 * ----------------------------- */

function createRecords_(configData, preservedData) {
  const startDate = getStartDate_(configData);
  const selectedDate = getSelectedDate_(configData);
  const trackerDays = Number(getConfigSetting_(configData, 'tracker_days', APP.INITIAL_DAYS)) || APP.INITIAL_DAYS;

  const dates = generateTrackingDates_(startDate, trackerDays, selectedDate);

  const records = dates.map(date => {
    const key = dateKey_(date);
    const saved = preservedData[key] || {};
    const savedHabits = saved.habits || {};
    const habits = {};

    configData.habits.forEach(habit => {
      habits[habit.key] = savedHabits[habit.key] === true;
    });

    return {
      date,
      weekStart: getWeekStart_(date),
      dayLabel: getDayLabel_(date),
      habits,
      daily_note: saved.daily_note || '',
      problem_today: saved.problem_today || '',
      tomorrow_focus: saved.tomorrow_focus || '',
      totalScore: 0,
      maxScore: 0,
      completionRate: '',
      status: '',
      streak: '',
      missedKeys: [],
      missedNames: [],
    };
  });

  calculateRecords_(records, configData);
  return records;
}

function calculateRecords_(records, configData) {
  const today = today_();
  const startDate = getStartDate_(configData);
  const targetRate = parsePercent_(getConfigSetting_(configData, 'target_completion_rate', APP.TARGET_COMPLETION_RATE), APP.TARGET_COMPLETION_RATE);
  const activeHabits = configData.habits.filter(habit => habit.active);
  const maxScore = activeHabits.reduce((sum, habit) => sum + numberOrZero_(habit.maxScore), 0);

  let streak = 0;

  records.sort((a, b) => a.date - b.date);

  records.forEach(record => {
    record.weekStart = getWeekStart_(record.date);
    record.dayLabel = getDayLabel_(record.date);
    record.maxScore = maxScore;
    record.missedKeys = [];
    record.missedNames = [];

    const score = activeHabits.reduce((sum, habit) => {
      const done = record.habits[habit.key] === true;

      if (!done) {
        record.missedKeys.push(habit.key);
        record.missedNames.push(habit.name);
      }

      return sum + (done ? numberOrZero_(habit.maxScore) : 0);
    }, 0);

    record.totalScore = score;

    if (record.date < startDate) {
      record.completionRate = '';
      record.status = '';
      record.streak = '';
      return;
    }

    if (record.date > today) {
      record.completionRate = '';
      record.status = 'Planned';
      record.streak = '';
      return;
    }

    record.completionRate = maxScore > 0 ? score / maxScore : 0;

    if (record.completionRate >= targetRate) {
      record.status = 'Good';
    } else if (record.completionRate >= 0.5) {
      record.status = 'Okay';
    } else {
      record.status = 'Bad';
    }

    if (record.status === 'Good') {
      streak += 1;
    } else {
      streak = 0;
    }

    record.streak = streak;
  });
}

function readExistingTrackerData_(sheet) {
  const preserved = {};

  if (!sheet || sheet.getLastRow() < APP.HELPER.START_ROW) return preserved;

  const widthToRead = Math.min(100, Math.max(1, sheet.getMaxColumns() - APP.HELPER.START_COL + 1));
  const headers = sheet.getRange(1, APP.HELPER.START_COL, 1, widthToRead).getValues()[0];

  if (headers[0] !== 'date') return preserved;

  let width = 0;
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === '') break;
    width++;
  }

  if (width === 0) return preserved;

  const realHeaders = headers.slice(0, width);
  const dailyNoteIndex = realHeaders.indexOf('daily_note');
  const problemIndex = realHeaders.indexOf('problem_today');
  const focusIndex = realHeaders.indexOf('tomorrow_focus');

  if (dailyNoteIndex === -1) return preserved;

  const habitKeys = realHeaders.slice(3, dailyNoteIndex);
  const values = sheet.getRange(APP.HELPER.START_ROW, APP.HELPER.START_COL, sheet.getLastRow() - 1, width).getValues();

  values.forEach(row => {
    const date = row[0];
    if (!(date instanceof Date)) return;

    const habits = {};

    habitKeys.forEach((key, index) => {
      habits[key] = row[3 + index] === true;
    });

    preserved[dateKey_(date)] = {
      habits,
      daily_note: normalizeTextValue_(row[dailyNoteIndex]),
      problem_today: problemIndex >= 0 ? normalizeTextValue_(row[problemIndex]) : '',
      tomorrow_focus: focusIndex >= 0 ? normalizeTextValue_(row[focusIndex]) : '',
    };
  });

  return preserved;
}

function recordsToPreservedData_(records) {
  const preserved = {};

  records.forEach(record => {
    preserved[dateKey_(record.date)] = {
      habits: Object.assign({}, record.habits),
      daily_note: record.daily_note || '',
      problem_today: record.problem_today || '',
      tomorrow_focus: record.tomorrow_focus || '',
    };
  });

  return preserved;
}

/* -----------------------------
 * Layout helpers
 * ----------------------------- */

function getHabitStartRow_() {
  return APP.LAYOUT.WEEK_START_ROW + 2;
}

function getScoreRow_(visibleHabits) {
  return getHabitStartRow_() + visibleHabits.length;
}

function getVisibleHabits_(habits) {
  const active = habits.filter(habit => habit.active);
  return active.length ? active : habits;
}

function getHelperSchema_(habits) {
  const headers = [
    'date',
    'week_start',
    'day_label',
    ...habits.map(habit => habit.key),
    'daily_note',
    'problem_today',
    'tomorrow_focus',
    'total_score',
    'max_score',
    'completion_rate',
    'status',
    'streak',
  ];

  const colByName = {};

  headers.forEach((header, index) => {
    colByName[header] = APP.HELPER.START_COL + index;
  });

  return {
    headers,
    startCol: APP.HELPER.START_COL,
    length: headers.length,
    colByName,
  };
}

function applyTrackerFormatting_(sheet) {
  sheet.getRange(1, 1, 80, APP.VISIBLE_LAST_COL).setFontFamily('Nunito');

  sheet.setColumnWidth(1, 230);
  for (let col = 2; col <= 8; col++) sheet.setColumnWidth(col, 95);
  sheet.setColumnWidth(9, 22);
  for (let col = 10; col <= 16; col++) sheet.setColumnWidth(col, 78);
}

function hideHelperColumns_(sheet, schema) {
  sheet.hideColumns(schema.startCol, schema.length);
}

/* -----------------------------
 * Generic helpers
 * ----------------------------- */

function ensureSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function resetSheet_(sheet) {
  const filter = sheet.getFilter();
  if (filter) filter.remove();

  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  sheet.getDataRange().breakApart();
  sheet.clear();
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearNote();
  sheet.setConditionalFormatRules([]);

  if (sheet.getMaxColumns() > 1) {
    sheet.showColumns(1, sheet.getMaxColumns());
  }
}

function ensureSheetSize_(sheet, rows, cols) {
  if (sheet.getMaxRows() < rows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  }

  if (sheet.getMaxColumns() < cols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
  }
}

function orderSheets_(ss) {
  const order = [APP.SHEETS.TRACKER, APP.SHEETS.CONFIG];

  order.forEach((name, index) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    }
  });
}

function applyBorders_(range) {
  range.setBorder(
    true,
    true,
    true,
    true,
    true,
    true,
    APP.COLORS.border,
    SpreadsheetApp.BorderStyle.SOLID
  );
}

function getDefaultSettingsRows_() {
  return [
    ['timezone', APP.TIMEZONE, 'Spreadsheet timezone.'],
    ['start_date', today_(), 'First day of tracking.'],
    ['tracker_days', APP.INITIAL_DAYS, 'Number of days stored by the tracker.'],
    ['target_completion_rate', APP.TARGET_COMPLETION_RATE, 'Threshold for a Good day.'],
    ['selected_date', today_(), 'The date currently shown on the Tracker.'],
  ];
}

function mergeSettingsRows_(map, order, rows) {
  rows.forEach(row => {
    const key = String(row[0] || '').trim();
    if (!key) return;

    if (!map[key]) order.push(key);

    map[key] = {
      value: row[1],
      description: row[2] || (map[key] ? map[key].description : ''),
    };
  });
}

function mergeHabitRows_(map, order, rows) {
  rows.forEach(row => {
    const key = String(row[0] || '').trim();
    if (!key) return;

    const englishDefault = DEFAULT_HABITS.find(defaultRow => defaultRow[0] === key);
    const habit = normalizeHabitRow_(row, englishDefault);

    if (!map[key]) order.push(key);
    map[key] = habit;
  });
}

function normalizeHabitRow_(row, englishDefault) {
  const key = String(row[0] || '').trim();

  if (englishDefault && isOldDefaultHabitName_(row[1])) {
    return {
      key,
      name: englishDefault[1],
      category: englishDefault[2],
      maxScore: Number(row[3]) || englishDefault[3],
      active: row[4] === true || String(row[4]).toUpperCase() === 'TRUE',
      description: englishDefault[5],
    };
  }

  return {
    key,
    name: String(row[1] || (englishDefault ? englishDefault[1] : key)).trim(),
    category: String(row[2] || (englishDefault ? englishDefault[2] : '')).trim(),
    maxScore: Number(row[3]) || (englishDefault ? englishDefault[3] : 0),
    active: row[4] === true || String(row[4]).toUpperCase() === 'TRUE',
    description: String(row[5] || (englishDefault ? englishDefault[5] : '')).trim(),
  };
}

function isOldDefaultHabitName_(value) {
  const text = String(value || '').trim();

  return [
    'Dậy đúng giờ',
    'Học tiếng Anh',
    'Code / làm project',
    'Vận động / thể thao',
    'Không lãng phí thời gian',
    'Dọn dẹp / kỷ luật cá nhân',
    'Review cuối ngày',
  ].indexOf(text) !== -1;
}

function readRows_(sheet, startRow, startCol, width, keyIndex) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return [];

  const values = sheet.getRange(startRow, startCol, lastRow - startRow + 1, width).getValues();

  return values.filter(row => String(row[keyIndex] || '').trim() !== '');
}

function readLogRows_(sheet, startRow, startCol, width) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return [];

  const values = sheet.getRange(startRow, startCol, lastRow - startRow + 1, width).getValues();

  return values.filter(row => row.some(value => value !== '' && value !== null));
}

function getConfigSetting_(configData, key, fallback) {
  const item = configData.settingsMap[key];
  if (!item) return fallback;

  const value = item.value;
  return value === '' || value === null || value === undefined ? fallback : value;
}

function getStartDate_(configData) {
  return parseDateSetting_(getConfigSetting_(configData, 'start_date', today_()), today_());
}

function getSelectedDate_(configData) {
  return parseDateSetting_(getConfigSetting_(configData, 'selected_date', today_()), today_());
}

function generateTrackingDates_(startDate, trackerDays, selectedDate) {
  const firstDate = minDate_(getWeekStart_(startDate), getWeekStart_(today_()), getWeekStart_(selectedDate));
  const configuredLastDate = addDays_(startDate, trackerDays - 1);
  const todayWeekEnd = addDays_(getWeekStart_(today_()), 6);
  const selectedWeekEnd = addDays_(getWeekStart_(selectedDate), 6);
  const lastDate = maxDate_(configuredLastDate, todayWeekEnd, selectedWeekEnd);

  const dates = [];

  for (let d = firstDate; d <= lastDate; d = addDays_(d, 1)) {
    dates.push(d);
  }

  return dates;
}

function recordsToMap_(records) {
  const map = {};

  records.forEach(record => {
    map[dateKey_(record.date)] = record;
  });

  return map;
}

function today_() {
  return normalizeDate_(new Date());
}

function normalizeDate_(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays_(date, days) {
  const d = normalizeDate_(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekStart_(date) {
  const d = normalizeDate_(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays_(d, diff);
}

function minDate_() {
  return Array.prototype.slice.call(arguments).reduce((min, date) => date < min ? date : min);
}

function maxDate_() {
  return Array.prototype.slice.call(arguments).reduce((max, date) => date > max ? date : max);
}

function dateKey_(date) {
  return Utilities.formatDate(normalizeDate_(date), APP.TIMEZONE, 'yyyy-MM-dd');
}

function formatDateLabel_(date) {
  return Utilities.formatDate(normalizeDate_(date), APP.TIMEZONE, 'dd/MM');
}

function formatLongDate_(date) {
  return Utilities.formatDate(normalizeDate_(date), APP.TIMEZONE, 'EEE, MMM d, yyyy');
}

function getDayLabel_(date) {
  const day = normalizeDate_(date).getDay();
  if (day === 0) return 'Sun';
  return DAY_LABELS[day - 1];
}

function parseDateSetting_(value, fallback) {
  if (value instanceof Date) return normalizeDate_(value);

  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return normalizeDate_(parsed);

  return normalizeDate_(fallback);
}

function parseIsoDate_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return normalizeDate_(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function parsePercent_(value, fallback) {
  if (typeof value === 'number') {
    return value > 1 ? value / 100 : value;
  }

  const text = String(value || '').replace('%', '').trim();
  const number = Number(text);

  if (isNaN(number)) return fallback;
  return number > 1 ? number / 100 : number;
}

function numberOrZero_(value) {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
}

function average_(values) {
  const clean = values
    .map(value => Number(value))
    .filter(value => !isNaN(value));

  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function percentText_(value) {
  const number = numberOrZero_(value);
  return Math.round(number * 100) + '%';
}

function statusWithEmoji_(status) {
  if (status === 'Good') return '✅ Good';
  if (status === 'Okay') return '🙂 Okay';
  if (status === 'Bad') return '😵 Bad';
  if (status === 'Planned') return '🌱 Planned';
  return '';
}

function colorForStatus_(status) {
  if (status === 'Good') return APP.COLORS.green;
  if (status === 'Okay') return APP.COLORS.yellow;
  if (status === 'Bad') return APP.COLORS.red;
  return APP.COLORS.softGray;
}

function textColorForStatus_(status) {
  if (status === 'Good') return APP.COLORS.greenText;
  if (status === 'Okay') return APP.COLORS.yellowText;
  if (status === 'Bad') return APP.COLORS.redText;
  return APP.COLORS.muted;
}

function iconForHabit_(key, category) {
  const byKey = {
    wake_up: '⏰',
    english: '🗣️',
    coding: '💻',
    exercise: '💪',
    focus: '🎯',
    clean: '✨',
    review: '📝',
  };

  const byCategory = {
    Discipline: '🛡️',
    Learning: '📚',
    Work: '⚙️',
    Health: '💚',
    Reflection: '🌙',
  };

  return byKey[key] || byCategory[category] || '⭐';
}

function paletteForDate_(date) {
  const d = normalizeDate_(date);
  const weekIndex = Math.floor((d.getDate() - 1) / 7) % APP.PALETTES.length;

  return APP.PALETTES[weekIndex];
}

function normalizeTextValue_(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}
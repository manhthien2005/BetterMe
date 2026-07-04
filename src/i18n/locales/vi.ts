import type { Dictionary } from "../dictionary";

export const vi: Dictionary = {
  locale: "vi",
  localeName: "Tiếng Việt",
  languageNames: { en: "English", vi: "Tiếng Việt" },
  nav: { dashboard: "Tổng quan", tracker: "Theo dõi", calendar: "Lịch", habits: "Thói quen", settings: "Cài đặt" },
  common: {
    appName: "BetterMe",
    loading: "Đang tải...",
    noData: "Chưa có dữ liệu",
    planned: "Đã lên kế hoạch",
    notTracked: "Chưa theo dõi",
    save: "Lưu",
    delete: "Xoá",
    clearLocalData: "Xoá dữ liệu cục bộ",
    previousWeek: "Tuần trước",
    nextWeek: "Tuần sau"
  },
  status: { Good: "Tốt", Okay: "Ổn", Bad: "Chưa tốt", Planned: "Đã lên kế hoạch", none: "Chưa theo dõi" },
  dashboard: {
    eyebrow: "BetterMe",
    title: "Tổng quan",
    subtitle: "Góc nhỏ mỗi ngày cho học tập, vận động, tập trung và tự nhìn lại.",
    todayProgress: "Tiến độ hôm nay",
    weekAverage: "Trung bình tuần",
    missedHabits: "Thói quen bỏ lỡ",
    currentStreak: "Chuỗi hiện tại",
    goodDays: (count) => `${count} ngày tốt`,
    missedCount: (count) => `Bỏ lỡ ${count}`,
    nothingMissed: "Không bỏ lỡ gì",
    streakHelper: "Ngày tốt liên tiếp",
    weeklyQuestPreview: "Xem nhanh nhiệm vụ tuần"
  },
  tracker: {
    title: "Bảng nhiệm vụ tuần",
    loading: "Đang tải bảng tuần...",
    weeklyTrackerLabel: "Theo dõi tuần",
    weeklyQuestDays: "Các ngày trong tuần",
    selectedDay: "Ngày đang chọn",
    status: "Trạng thái",
    score: "Điểm",
    streak: "Chuỗi",
    noRecord: "Chưa có bản ghi cho ngày này.",
    dailyHabits: "Thói quen hằng ngày",
    noActiveHabits: "Chưa có thói quen đang bật.",
    loadingTracker: "Đang tải theo dõi...",
    reflectionSaved: "Đã lưu ghi chú",
    dailyReflection: "Tự nhìn lại trong ngày",
    dailyNote: "Ghi chú ngày",
    challengeToday: "Thử thách hôm nay",
    tomorrowFocus: "Trọng tâm ngày mai",
    saveReflection: "Lưu ghi chú"
  },
  calendar: {
    title: "Lịch",
    loading: "Đang tải lịch...",
    monthCalendar: "Lịch tháng",
    selected: "đang chọn",
    today: "hôm nay"
  },
  habits: {
    title: "Cấu hình thói quen",
    loading: "Đang tải thói quen...",
    addHabit: "Thêm thói quen",
    newHabitName: "Tên thói quen mới",
    newHabitCategory: "Nhóm thói quen mới",
    newHabitScore: "Điểm thói quen mới",
    newHabitDescription: "Mô tả thói quen mới",
    active: "Đang bật",
    habitName: (name) => `Tên thói quen: ${name}`,
    category: (name) => `Nhóm: ${name}`,
    maxScore: (name) => `Điểm tối đa: ${name}`,
    description: (name) => `Mô tả: ${name}`,
    activeLabel: (name) => `Đang bật: ${name}`,
    moveUp: (name) => `Đưa ${name} lên`,
    moveDown: (name) => `Đưa ${name} xuống`,
    deleteHabit: (name) => `Xoá ${name}`,
    saveHabit: (name) => `Lưu ${name}`,
    validation: {
      nameRequired: "Tên thói quen là bắt buộc",
      keyRequired: "Mã thói quen là bắt buộc",
      scoreNonNegative: "Điểm tối đa không được âm",
      duplicateKey: "Mã thói quen đã tồn tại"
    }
  },
  settings: {
    title: "Cài đặt",
    loading: "Đang tải cài đặt...",
    localOnlyNote: "BetterMe đang lưu cục bộ ở Giai đoạn 1. Dữ liệu nằm trên thiết bị này cho đến khi có backend trong tương lai.",
    timezone: "Múi giờ",
    startDate: "Ngày bắt đầu",
    selectedDate: "Ngày đang chọn",
    trackingDays: "Số ngày theo dõi",
    targetCompletionRate: "Mục tiêu hoàn thành",
    theme: "Giao diện",
    language: "Ngôn ngữ",
    saveSettings: "Lưu cài đặt",
    settingsSaved: "Đã lưu cài đặt",
    localDataReset: "Đã xoá dữ liệu cục bộ",
    validation: {
      timezoneRequired: "Múi giờ là bắt buộc",
      trackerDaysPositive: "Số ngày theo dõi phải ít nhất là 1",
      targetRateRange: "Mục tiêu hoàn thành phải nằm trong khoảng 0 đến 100"
    }
  },
  theme: {
    cuteCat: "Mèo dễ thương",
    studyCorner: "Góc học tập",
    modernFocus: "Tập trung hiện đại",
    minimalCalm: "Tối giản bình yên"
  },
  charts: {
    thirtyDayProgressTitle: "Tiến độ 30 ngày",
    thirtyDayProgressDescription: "Tỷ lệ hoàn thành mỗi ngày trong 30 ngày kết thúc ở ngày đang chọn.",
    selectedWeekHabitsTitle: "Thói quen tuần đang chọn",
    selectedWeekHabitsDescription: "Tỷ lệ hoàn thành từng thói quen đang bật trong tuần đang chọn.",
    dailyCompletionRate: "Tỷ lệ hoàn thành mỗi ngày",
    completionRate: "Tỷ lệ hoàn thành",
    habitCompletion: "Hoàn thành thói quen",
    daysCompleted: (completed, total) => `${completed}/${total} ngày`,
    noData: "Chưa có dữ liệu"
  }
};

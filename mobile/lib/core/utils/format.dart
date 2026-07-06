/// Tiny date/time formatting helpers — deliberately hand-rolled instead of
/// adding the `intl` package for two format strings (project rule: no new
/// heavy dependencies without discussion).
library;

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/// "Sat 5 Jul" (adds " 2025" when [d] is not this year).
String formatDay(DateTime d) {
  final now = DateTime.now();
  final base = '${_weekdays[d.weekday - 1]} ${d.day} ${_months[d.month - 1]}';
  return d.year == now.year ? base : '$base ${d.year}';
}

/// "2:07 PM"
String formatTime(DateTime d) {
  final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
  final m = d.minute.toString().padLeft(2, '0');
  return '$h:$m ${d.hour < 12 ? 'AM' : 'PM'}';
}

/// "Sat 5 Jul · 2:07 PM"
String formatDayTime(DateTime d) => '${formatDay(d)} · ${formatTime(d)}';

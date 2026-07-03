import 'package:flutter/services.dart';

/// Masks matric input to the FUTA pattern `ABC/00/0000` — 3 letters, 2 digits,
/// 4 digits — inserting the slashes automatically as the student types, and
/// dropping anything that doesn't fit the current segment.
class MatricInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue _, TextEditingValue next) {
    final raw = next.text.toUpperCase().replaceAll(RegExp('[^A-Z0-9]'), '');

    final letters = StringBuffer();
    final part2 = StringBuffer();
    final part3 = StringBuffer();
    for (final ch in raw.split('')) {
      final isLetter = RegExp('[A-Z]').hasMatch(ch);
      final isDigit = RegExp('[0-9]').hasMatch(ch);
      if (letters.length < 3) {
        if (isLetter) letters.write(ch); // segment 1 only accepts letters
      } else if (part2.length < 2) {
        if (isDigit) part2.write(ch);
      } else if (part3.length < 4) {
        if (isDigit) part3.write(ch);
      }
    }

    final out = StringBuffer(letters);
    if (letters.length == 3) {
      out.write('/');
      out.write(part2);
      if (part2.length == 2) {
        out.write('/');
        out.write(part3);
      }
    }

    final text = out.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

/// Formats the local part of a Nigerian mobile number as `803 123 4567`.
/// The country code (+234) is shown as a field prefix, not stored here; a single
/// leading 0 is dropped so `0803…` and `803…` both normalise to 10 digits.
class NigerianPhoneFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue _, TextEditingValue next) {
    var digits = next.text.replaceAll(RegExp('[^0-9]'), '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.length > 10) digits = digits.substring(0, 10);

    final b = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i == 3 || i == 6) b.write(' ');
      b.write(digits[i]);
    }

    final text = b.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

/// Strips a formatted Nigerian local number down to its 10 digits (no spaces,
/// no leading 0) — for validation and for building the E.164 value to send.
String nigerianLocalDigits(String formatted) {
  var d = formatted.replaceAll(RegExp('[^0-9]'), '');
  if (d.startsWith('0')) d = d.substring(1);
  return d;
}

import 'package:flutter/widgets.dart';

/// Corner-radius scale. Generous radii give the consumer transit-fintech feel;
/// keeping them named means the whole app rounds consistently.
class AppRadius {
  AppRadius._();

  static const double sm = 8; // chips, small tags
  static const double md = 12; // inputs, buttons
  static const double lg = 16; // cards, sheets
  static const double xl = 24; // hero surfaces, bottom sheets
  static const double pill = 999; // fully rounded (pills, avatars)

  static const BorderRadius brSm = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius brMd = BorderRadius.all(Radius.circular(md));
  static const BorderRadius brLg = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius brXl = BorderRadius.all(Radius.circular(xl));
}

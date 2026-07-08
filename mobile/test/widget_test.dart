import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:movio_mobile/core/theme/app_colors.dart';
import 'package:movio_mobile/core/theme/app_theme.dart';
import 'package:movio_mobile/shared/widgets/primary_button.dart';

void main() {
  test('light theme uses the MovIO brand green as its primary color', () {
    final theme = AppTheme.light();
    expect(theme.colorScheme.primary, AppColors.brand700);
    expect(theme.useMaterial3, isTrue);
  });

  testWidgets('PrimaryButton shows a spinner and hides its label while loading',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: PrimaryButton(label: 'Sign in', onPressed: () {}, loading: true),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Sign in'), findsNothing);
  });
}

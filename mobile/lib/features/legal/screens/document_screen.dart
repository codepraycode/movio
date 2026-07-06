import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/screen_header.dart';

/// A titled heading + its body paragraphs. The atom the legal/policy screens
/// are built from.
class DocSection {
  const DocSection(this.heading, this.paragraphs);

  final String heading;
  final List<String> paragraphs;
}

/// Generic reader for a static policy/support document (Terms, Privacy…). Kept
/// deliberately plain — a scrollable, well-spaced document with a "last updated"
/// stamp — so adding another document is just new content, not new UI.
class DocumentScreen extends StatelessWidget {
  const DocumentScreen({
    super.key,
    required this.title,
    required this.intro,
    required this.lastUpdated,
    required this.sections,
  });

  final String title;
  final String intro;
  final String lastUpdated;
  final List<DocSection> sections;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: AppBackground(
          child: SafeArea(
            child: Column(
              children: [
                ScreenHeader(title: title),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.page),
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                        decoration: BoxDecoration(
                          color: AppColors.brand50,
                          borderRadius: AppRadius.brSm,
                        ),
                        child: Text(
                          'Last updated · $lastUpdated',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.brand700,
                            fontFamily: AppTypography.mono,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(intro, style: AppTypography.bodyMd),
                      const SizedBox(height: AppSpacing.xl),
                      for (final section in sections) ...[
                        Text(section.heading, style: AppTypography.titleMd),
                        const SizedBox(height: AppSpacing.sm),
                        for (final p in section.paragraphs) ...[
                          Text(
                            p,
                            style: AppTypography.bodyMd
                                .copyWith(color: AppColors.inkMuted),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                        ],
                        const SizedBox(height: AppSpacing.lg),
                      ],
                      const SizedBox(height: AppSpacing.xl),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

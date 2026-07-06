import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/screen_header.dart';
import '../../auth/data/auth_models.dart';
import '../../auth/state/auth_provider.dart';
import '../../legal/legal_content.dart';
import '../../nfc/data/nfc_capability_service.dart';
import '../../nfc/screens/nfc_setup_screen.dart';
import '../../routes/screens/routes_screen.dart';
import '../../support/screens/help_screen.dart';
import '../../trips/screens/my_trips_screen.dart';
import '../../wallet/screens/credit_history_screen.dart';

/// Profile & settings: who's signed in, their account details, shortcuts into
/// the transit features, and the (confirmed) way out. Replaces the bare logout
/// icon that used to sit on the home greeting bar.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _loggingOut = false;

  void _push(BuildContext context, Widget screen) {
    HapticFeedback.selectionClick();
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _openNfcStatus(BuildContext context) async {
    HapticFeedback.selectionClick();
    final done = await NfcCapabilityService().isSetupDone();
    if (!context.mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => NfcSetupScreen(statusMode: done)),
    );
  }

  Future<void> _confirmLogout() async {
    HapticFeedback.selectionClick();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brLg),
        title: Text('Log out?', style: AppTypography.headingMd),
        content: Text(
          'You’ll need your email and password to sign back in.',
          style: AppTypography.bodyMd.copyWith(color: AppColors.inkMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text('Cancel',
                style: AppTypography.button.copyWith(color: AppColors.inkMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text('Log out',
                style: AppTypography.button.copyWith(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    // Show the button's spinner while the session is torn down. logout() clears
    // secure storage and flips auth state; awaiting it means the preloader is
    // truthful even if the storage write is briefly slow.
    setState(() => _loggingOut = true);
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    // Pushed routes on the root navigator outlive an AuthGate swap — unwind to
    // home first so logout lands on the login screen, not a stale profile.
    Navigator.of(context).popUntil((r) => r.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: AppBackground(
          child: SafeArea(
            child: Column(
              children: [
                const ScreenHeader(title: 'Profile'),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.page),
                    children: [
                      Entrance(child: _IdentityCard(user: user)),
                      const SizedBox(height: AppSpacing.lg),
                      Entrance(
                        delay: const Duration(milliseconds: 60),
                        child: _Section(
                          title: 'ACCOUNT',
                          children: [
                            _InfoRow(
                              icon: Icons.mail_outline_rounded,
                              label: 'Email',
                              value: user?.email ?? '—',
                            ),
                            _InfoRow(
                              icon: Icons.phone_outlined,
                              label: 'Phone',
                              value: (user?.phone?.isNotEmpty ?? false)
                                  ? user!.phone!
                                  : 'Not added',
                            ),
                            _InfoRow(
                              icon: Icons.badge_outlined,
                              label: 'Matric number',
                              value: user?.matricNo ?? '—',
                              mono: true,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Entrance(
                        delay: const Duration(milliseconds: 120),
                        child: _Section(
                          title: 'TRANSIT',
                          children: [
                            _LinkRow(
                              icon: Icons.contactless_rounded,
                              label: 'Tap-to-board status',
                              onTap: () => _openNfcStatus(context),
                            ),
                            _LinkRow(
                              icon: Icons.receipt_long_rounded,
                              label: 'My trips',
                              onTap: () =>
                                  _push(context, const MyTripsScreen()),
                            ),
                            _LinkRow(
                              icon: Icons.swap_vert_rounded,
                              label: 'Credit history',
                              onTap: () =>
                                  _push(context, const CreditHistoryScreen()),
                            ),
                            _LinkRow(
                              icon: Icons.route_rounded,
                              label: 'Routes & stops',
                              onTap: () => _push(context, const RoutesScreen()),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Entrance(
                        delay: const Duration(milliseconds: 160),
                        child: _Section(
                          title: 'LEGAL & SUPPORT',
                          children: [
                            _LinkRow(
                              icon: Icons.help_outline_rounded,
                              label: 'Help & support',
                              onTap: () =>
                                  _push(context, const HelpScreen()),
                            ),
                            _LinkRow(
                              icon: Icons.description_outlined,
                              label: 'Terms of Service',
                              onTap: () => _push(context, LegalContent.terms()),
                            ),
                            _LinkRow(
                              icon: Icons.privacy_tip_outlined,
                              label: 'Privacy Policy',
                              onTap: () =>
                                  _push(context, LegalContent.privacy()),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Entrance(
                        delay: const Duration(milliseconds: 200),
                        child: _Section(
                          title: 'ABOUT',
                          children: [
                            _InfoRow(
                              icon: Icons.info_outline_rounded,
                              label: 'Version',
                              value: '1.0.0',
                              mono: true,
                            ),
                            _InfoRow(
                              icon: Icons.school_outlined,
                              label: 'Project',
                              value: 'MovIO · FUTA campus transport',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Entrance(
                        delay: const Duration(milliseconds: 240),
                        child: _LogoutButton(
                          loading: _loggingOut,
                          onTap: _confirmLogout,
                        ),
                      ),
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

// ─── Identity hero ───────────────────────────────────────────────────────────

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({this.user});

  final AuthUser? user;

  @override
  Widget build(BuildContext context) {
    final name =
        user == null ? '—' : '${user!.firstName} ${user!.lastName}'.trim();
    final initials = user?.initials ?? '';
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: AppRadius.brXl,
        boxShadow: const [
          BoxShadow(
            color: Color(0x2E0F7A52),
            blurRadius: 28,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            height: 62,
            width: 62,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.onBrand.withValues(alpha: 0.18),
              border: Border.all(
                  color: AppColors.onBrand.withValues(alpha: 0.4)),
            ),
            alignment: Alignment.center,
            child: Text(
              initials.isEmpty ? '?' : initials,
              style: AppTypography.headingMd.copyWith(
                color: AppColors.onBrand,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.headingMd
                      .copyWith(color: AppColors.onBrand),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.onBrand.withValues(alpha: 0.16),
                    borderRadius: AppRadius.brSm,
                  ),
                  child: Text(
                    (user?.role ?? 'student').toUpperCase(),
                    style: AppTypography.caption.copyWith(
                      color: AppColors.onBrand,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Sections & rows ─────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(
              left: AppSpacing.xs, bottom: AppSpacing.sm),
          child: Text(
            title,
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
              color: AppColors.inkFaint,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.brLg,
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            children: [
              for (var i = 0; i < children.length; i++) ...[
                children[i],
                if (i != children.length - 1)
                  const Divider(height: 1, color: AppColors.lineSoft),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// Read-only fact row (email, matric, version…).
class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.mono = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.inkMuted),
          const SizedBox(width: AppSpacing.md),
          Expanded(child: Text(label, style: AppTypography.bodyMd)),
          const SizedBox(width: AppSpacing.md),
          Flexible(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: mono
                  ? AppTypography.caption.copyWith(
                      fontFamily: AppTypography.mono, color: AppColors.ink)
                  : AppTypography.bodyMd.copyWith(color: AppColors.inkMuted),
            ),
          ),
        ],
      ),
    );
  }
}

/// Tappable navigation row with a chevron.
class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        child: Row(
          children: [
            Container(
              height: 36,
              width: 36,
              decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: AppRadius.brMd,
              ),
              child: Icon(icon, size: 19, color: AppColors.brand700),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: Text(label, style: AppTypography.bodyMd)),
            const Icon(Icons.chevron_right_rounded,
                size: 20, color: AppColors.inkFaint),
          ],
        ),
      ),
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onTap, this.loading = false});

  final VoidCallback onTap;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: AppRadius.brMd,
      child: InkWell(
        borderRadius: AppRadius.brMd,
        // Disabled while logging out so it can't be double-tapped.
        onTap: loading ? null : onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brMd,
            border: Border.all(color: AppColors.error.withValues(alpha: 0.35)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading) ...[
                const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    valueColor: AlwaysStoppedAnimation(AppColors.error),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Logging out…',
                  style: AppTypography.button.copyWith(color: AppColors.error),
                ),
              ] else ...[
                const Icon(Icons.logout_rounded,
                    size: 19, color: AppColors.error),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Log out',
                  style: AppTypography.button.copyWith(color: AppColors.error),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

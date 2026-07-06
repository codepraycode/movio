import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

/// Global connectivity notice (MOB-9). Wraps the whole app (installed via
/// `MaterialApp.builder`) so every screen gets the same treatment without
/// per-screen wiring:
///
///   • offline           → a dark "No internet connection" bar slides down and
///                          stays until a link returns.
///   • back online        → a green "Back online" bar shows briefly, then leaves.
///
/// It's a slide-in banner rather than a one-shot SnackBar so the offline state
/// stays visible the whole time it applies (a SnackBar would auto-dismiss and
/// leave the user unsure), while still reading as a lightweight toast.
class ConnectivityBanner extends StatefulWidget {
  const ConnectivityBanner({super.key, required this.child});

  final Widget child;

  @override
  State<ConnectivityBanner> createState() => _ConnectivityBannerState();
}

class _ConnectivityBannerState extends State<ConnectivityBanner> {
  ConnectivityProvider? _conn;
  bool _online = true;
  bool _showRestored = false;
  Timer? _restoreTimer;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final conn = context.read<ConnectivityProvider>();
    if (!identical(conn, _conn)) {
      _conn?.removeListener(_onChange);
      _conn = conn;
      _online = conn.isOnline;
      conn.addListener(_onChange);
    }
  }

  void _onChange() {
    final online = _conn?.isOnline ?? true;
    if (online == _online) return;
    setState(() {
      _online = online;
      _restoreTimer?.cancel();
      if (online) {
        // Show a brief "back online" confirmation, then slide away.
        _showRestored = true;
        _restoreTimer = Timer(const Duration(seconds: 2), () {
          if (mounted) setState(() => _showRestored = false);
        });
      } else {
        _showRestored = false;
      }
    });
  }

  @override
  void dispose() {
    _restoreTimer?.cancel();
    _conn?.removeListener(_onChange);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visible = !_online || _showRestored;
    final topInset = MediaQuery.of(context).padding.top;

    return Stack(
      children: [
        widget.child,
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: IgnorePointer(
            child: AnimatedSlide(
              duration: const Duration(milliseconds: 260),
              curve: Curves.easeOutCubic,
              offset: visible ? Offset.zero : const Offset(0, -1),
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 200),
                opacity: visible ? 1 : 0,
                child: _Bar(online: _online, topInset: topInset),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.online, required this.topInset});

  final bool online;
  final double topInset;

  @override
  Widget build(BuildContext context) {
    final bg = online ? AppColors.brand600 : AppColors.ink;
    final icon = online ? Icons.wifi_rounded : Icons.wifi_off_rounded;
    final text = online ? 'Back online' : 'No internet connection';

    return Material(
      color: bg,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, topInset + 8, 16, 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: AppColors.onBrand),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                text,
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(
                  color: AppColors.onBrand,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

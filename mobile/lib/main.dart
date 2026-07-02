import 'package:flutter/material.dart';

void main() {
  runApp(const MovIOApp());
}

class MovIOApp extends StatelessWidget {
  const MovIOApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MovIO',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1A56DB)),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'MovIO',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Text('Smart Campus Transport — FUTA'),
            ],
          ),
        ),
      ),
    );
  }
}

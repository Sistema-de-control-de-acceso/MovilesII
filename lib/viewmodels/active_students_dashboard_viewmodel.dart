import 'package:flutter/material.dart';
import '../models/alumno_model.dart';
import '../services/guard_reports_service.dart';

class ActiveStudentsDashboardViewModel extends ChangeNotifier {
  DateTime? startDate;
  DateTime? endDate;
  List<AlumnoModel> ranking = [];
  bool isLoading = false;
  int totalAccesses = 0;

  Future<void> fetchRanking({DateTime? from, DateTime? to}) async {
    isLoading = true;
    notifyListeners();
    startDate = from;
    endDate = to;
    final now = DateTime.now();
    final inicio = from ?? DateTime(now.year, now.month, 1);
    final fin = to ?? now;
    final result = await GuardReportsService().getActiveStudentsRanking(inicio, fin, limit: 10);
    ranking = result;
    totalAccesses = ranking.fold(0, (sum, alumno) => sum + (alumno.accesos ?? 0));
    isLoading = false;
    notifyListeners();
  }
}

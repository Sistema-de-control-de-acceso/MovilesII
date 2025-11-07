import 'package:flutter/material.dart';
import '../../viewmodels/active_students_dashboard_viewmodel.dart';
import '../../models/alumno_model.dart';
import 'package:provider/provider.dart';

class ActiveStudentsDashboardView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ActiveStudentsDashboardViewModel(),
      child: Scaffold(
        appBar: AppBar(title: Text('Estudiantes más activos')),
        body: Consumer<ActiveStudentsDashboardViewModel>(
          builder: (context, vm, _) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          child: Text(vm.startDate == null ? 'Fecha inicio' : vm.startDate!.toLocal().toString().split(' ')[0]),
                          onPressed: () async {
                            DateTime? picked = await showDatePicker(
                              context: context,
                              initialDate: DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime.now(),
                            );
                            if (picked != null) {
                              vm.fetchRanking(from: picked, to: vm.endDate);
                            }
                          },
                        ),
                      ),
                      Expanded(
                        child: TextButton(
                          child: Text(vm.endDate == null ? 'Fecha fin' : vm.endDate!.toLocal().toString().split(' ')[0]),
                          onPressed: () async {
                            DateTime? picked = await showDatePicker(
                              context: context,
                              initialDate: DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime.now(),
                            );
                            if (picked != null) {
                              vm.fetchRanking(from: vm.startDate, to: picked);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                if (vm.isLoading)
                  Center(child: CircularProgressIndicator()),
                if (!vm.isLoading)
                  Expanded(
                    child: ListView.builder(
                      itemCount: vm.ranking.length,
                      itemBuilder: (context, index) {
                        final alumno = vm.ranking[index];
                        return ListTile(
                          leading: CircleAvatar(child: Text('${index + 1}')),
                          title: Text(alumno.nombre),
                          subtitle: Text('Matrícula: ${alumno.matricula}'),
                          trailing: Text('Accesos: ${alumno.accesos ?? 0}'),
                        );
                      },
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text('Total de accesos: ${vm.totalAccesses}'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

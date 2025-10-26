src/modules/htr/orgchart/orgchartList.page.tsx и @src/modules/htr/orgchart/orgchartView.page.tsx содержат кнопки "Submit for approval" (Send for approval).
логика работы следующая:

1. до утверждения огранизационной структуры все документ подлежат утверждению первым пользователем ассоциированным с компанией (owner?).
2. При отправлении на утверждение

- task initiator - пользователь который отправил на согласование получает задачу со статусом pending approval
- owner получает задачу src/modules/task - по согласованию документов

3. По документу могут быть решения (с комментариями)

- approved,
- declined

4. Task initiator получает ответ по задаче approved или declined
   для целей audit trail logs - важно хранить документ и задачи
5. адаптируй и используй файлы ниже для выполнения поставленной задачи
   @src/modules/doa/doa.page.tsx
   @src/modules/doa/doaDetail.page.tsx
   @src/modules/doa/doaMatrixForm.page.tsx
   @src/modules/task/createTask.page.tsx @src/modules/task/taskDetail.page.tsx @src/modules/task/tasks.page.tsx

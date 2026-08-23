import { submitMasterConsult } from "./message-store";
import { saveRecord, buildPersonKey, buildPersonLabel } from "./record-store";
import { saveMasterCrmSubmission } from "./master-crm-store";
import { MASTER_CONSULT_PRICE } from "./master-pay-store";
import type { BirthInfo } from "./types";

export interface MasterConsultFormData {
  userId: string;
  name: string;
  birthInfo: BirthInfo;
  question: string;
}

export function submitMasterConsultWithSave(form: MasterConsultFormData) {
  const name = form.name.trim();
  const question = form.question.trim();
  const birth = form.birthInfo;
  const consult = submitMasterConsult({
    userId: form.userId,
    name,
    birthYear: birth.year,
    birthMonth: birth.month,
    birthDay: birth.day,
    birthHour: birth.hour,
    calendar: birth.calendar ?? "solar",
    question,
  });
  const record = saveRecord({
    type: "master",
    personKey: buildPersonKey(name, birth),
    personName: name,
    personLabel: buildPersonLabel(name, birth),
    title: "真人大师咨询",
    summary: question.slice(0, 60),
    data: {
      question,
      calendar: birth.calendar ?? "solar",
      birth,
      status: "pending",
      price: MASTER_CONSULT_PRICE,
      consultId: consult.id,
    },
  });
  saveMasterCrmSubmission({
    userId: form.userId,
    name,
    birthYear: birth.year,
    birthMonth: birth.month,
    birthDay: birth.day,
    birthHour: birth.hour,
    calendar: birth.calendar ?? "solar",
    question,
    price: MASTER_CONSULT_PRICE,
    consultId: consult.id,
    recordId: record.id,
    birth,
  });
  return { consult, record };
}

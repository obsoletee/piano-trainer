import { useAppLanguage } from "../hooks/useAppLanguage";

import { useTranslation } from "../hooks/useTranslation";

function ContactsPage() {
  const { t } = useTranslation();
  const en = useAppLanguage() === "en";
  return <main className="content-page"><div className="page-heading"><h1>{t("contacts.title")}</h1></div></main>;
}
export default ContactsPage;

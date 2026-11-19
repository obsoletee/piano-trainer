import { useAppLanguage } from "../hooks/useAppLanguage";

function ContactsPage() {
  const en = useAppLanguage() === "en";
  return <main className="content-page"><div className="page-heading"><h1>{en ? "Contacts" : "Контакты"}</h1></div></main>;
}
export default ContactsPage;

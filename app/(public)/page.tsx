import { Hero } from "@/components/home/Hero";
import {
  AboutPreview,
  ApproachSection,
  BookingCta,
  ContactSection,
  ServicesPreview,
  WhyDkcSection,
} from "@/components/home/HomeSections";
import { getActiveServices } from "@/lib/db/services";

export default async function HomePage() {
  // Real catalogue from Supabase - nothing hard-coded.
  const services = await getActiveServices();

  return (
    <>
      <Hero />
      <ApproachSection />
      <ServicesPreview services={services} />
      <WhyDkcSection />
      <BookingCta />
      <AboutPreview />
      <ContactSection />
    </>
  );
}

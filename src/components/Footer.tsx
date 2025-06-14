
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear} Rasoi Raja. All rights reserved.</p>
        <p className="mt-1">Connecting you to homely meals, wherever you are.</p>
      </div>
    </footer>
  );
};

export default Footer;


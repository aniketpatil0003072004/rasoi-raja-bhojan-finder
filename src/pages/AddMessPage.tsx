
import AddMessForm from "@/components/AddMessForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AddMessPage = () => {
  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List Your Mess</CardTitle>
            <CardDescription>
              Fill out the form below to add your mess to our platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddMessForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMessPage;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog } from "@radix-ui/themes";
import HealthCampList from "../pages/HealthCampList";
import { useCureitContext } from "../utils/ContextProvider";
import axios from "axios";

const VolunteerConfirmationModal = ({
  open,
  onOpenChange,
  campDetails,
  doctorId,
}) => {
  const api = import.meta.env.VITE_API_BASE_URL;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    detailsCorrect: false,
    documentsVerified: false,
    contactUnderstanding: false,
    availability: false,
    qualifications: false,
  });

  const handleChecklistChange = (field) => {
    setChecklist({
      ...checklist,
      [field]: !checklist[field],
    });
  };

  const allChecked = Object.values(checklist).every((value) => value === true);

  const handleSubmit = async () => {
    if (!allChecked) {
      alert("Please confirm all requirements before proceeding");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${api}/api/healthWorkerRoutes/doctor-volunteer`,
        {
          doctorId: doctorId,
          campId: campDetails?.id,
          camp_start_date: campDetails?.startDate,
          camp_end_date: campDetails?.endDate,
        },
      );
      alert(
        "Thank you for volunteering! The camp organizer will be in touch shortly.",
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting volunteer request:", error);
      alert(`${error.response.data.error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-lg">
        <Dialog.Title>Volunteer Confirmation</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Thank you for your interest in volunteering!
        </Dialog.Description>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Before confirming your participation in this health camp, please
            review and acknowledge the following important points:
          </p>
        </div>

        <div className="mb-4 rounded-md bg-blue-50 p-4">
          <strong>Health Camp Details:</strong>
          <p className="mb-1 text-sm">
            <b><i><u>Name: </u></i></b> {campDetails?.campName}
          </p>
          <p className="mb-1 text-sm">
            <b><i><u>Location: </u></i></b> {campDetails?.address}
          </p>
          <p className="mb-1 text-sm">
            <b><i><u>Date:</u></i></b> {campDetails?.startDate} - {campDetails?.endDate}
          </p>
          <p className="mb-0 text-sm">
            <b><i><u>Organizer:</u></i></b> {campDetails?.organizerName}
          </p>
          <p className="mb-0 text-sm">
            <b><i><u>Contact Person:</u></i></b> {campDetails?.contactPerson}
          </p>
          <p className="mb-0 text-sm">
            <b><i><u>Contact No:</u></i></b> {campDetails?.contactPhone}
          </p>
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="detailsCorrect"
              checked={checklist.detailsCorrect}
              onChange={() => handleChecklistChange("detailsCorrect")}
              className="mr-2 mt-1"
            />
            <label htmlFor="detailsCorrect" className="text-sm">
              I have verified that all health camp details are correct and
              accurate.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="documentsVerified"
              checked={checklist.documentsVerified}
              onChange={() => handleChecklistChange("documentsVerified")}
              className="mr-2 mt-1"
            />
            <label htmlFor="documentsVerified" className="text-sm">
              I have reviewed all attached documents and confirmed they appear
              legitimate.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="contactUnderstanding"
              checked={checklist.contactUnderstanding}
              onChange={() => handleChecklistChange("contactUnderstanding")}
              className="mr-2 mt-1"
            />
            <label htmlFor="contactUnderstanding" className="text-sm">
              I understand I need to contact{" "}
              {campDetails?.contactPerson || "the camp coordinator"} to discuss
              my participation.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="availability"
              checked={checklist.availability}
              onChange={() => handleChecklistChange("availability")}
              className="mr-2 mt-1"
            />
            <label htmlFor="availability" className="text-sm">
              I confirm my availability for the entire duration of the health
              camp.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="qualifications"
              checked={checklist.qualifications}
              onChange={() => handleChecklistChange("qualifications")}
              className="mr-2 mt-1"
            />
            <label htmlFor="qualifications" className="text-sm">
              I confirm that my qualifications and credentials match the
              requirements for this health camp.
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleSubmit} disabled={!allChecked || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Confirm Participation"}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

function HealthCampsPage() {
  const api = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { profile } = useCureitContext();
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [myVolunteered, setMyVolunteered] = useState([]);
  const [loadingVolunteered, setLoadingVolunteered] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchCamps = async () => {
      try {
        const res = await axios.get(
          `${api}/api/healthWorkerRoutes/doctor/volunteered/${profile?.id}`,
        );
        setMyVolunteered(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVolunteered(false);
      }
    };
    fetchCamps();
  }, [profile?.id]);

  const handleVolunteer = ({ index, camp }) => {
    setSelectedCamp(camp);
    setShowVolunteerModal(true);
  };

  return (
    <div className="mt-12">
      {!loadingVolunteered && (
        <HealthCampList
          userRole={profile?.role || "user"}
          userLocation={profile?.location || ""}
          onVolunteer={handleVolunteer}
          volunteeredCamps={myVolunteered}
        />
      )}

      {selectedCamp && (
        <VolunteerConfirmationModal
          open={showVolunteerModal}
          onOpenChange={setShowVolunteerModal}
          campDetails={selectedCamp}
          doctorId={profile?.id}
        />
      )}
    </div>
  );
}

export default HealthCampsPage;
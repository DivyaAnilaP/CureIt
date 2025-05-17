const handleSignUp = async () => {
  const { email, password, name, phoneNumber } = signupData;
  const signUpData2 = { ...signupData };
  const frontend_base_url = import.meta.env.VITE_frontend_base_url;

  try {
    // First check if email exists in your backend
    const checkResponse = await fetch(`${API_BASE_URL}/api/user/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const checkData = await checkResponse.json();

    if (checkData.exists) {
      setErrorMessage("Email already exists");
      toast.error("Email already exists.");
      return;
    }

    // Proceed with Supabase signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone: phoneNumber,
      options: {
        data: { display_name: name, phone: phoneNumber },
        emailRedirectTo: `${frontend_base_url}/cureit/login`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setSuccessMessage("");
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      signUpData2.id = userId;

      mutate.mutate(signUpData2, {
        onSuccess: () => {
          setErrorMessage("");
          setSuccessMessage("Sign-up successful! Please check your email to verify your account.");
          toast.success("Verification Email sent");
          setTimeout(() => {
            navigate("/verification", { state: { email } });
          }, 500);
        },
        onError: (error) => {
          console.error(error);
          setErrorMessage("Failed to create user profile");
          toast.error("Failed to create user profile");
          supabase.auth.admin.deleteUser(userId); // Cleanup
        },
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    setErrorMessage("An error occurred during signup");
    toast.error("Signup failed. Please try again.");
  }
};

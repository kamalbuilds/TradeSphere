type Profile = {
  id: string;
  name: string;
  bio: string;
  handle: string;
  ownedBy: string;
  picture: {
    original: {
      url: string;
    };
  };
  stats: {
    totalFollowers: number;
  };
  __typename: "Profile";
};

export default Profile;

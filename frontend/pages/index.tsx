import { useQuery } from "@tanstack/react-query";
import mostFollowedProfiles from "../graphql/query/mostFollowedProfiles";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import { MediaRenderer } from "@thirdweb-dev/react";
import Messages from "../components/Message";
import { Accordion } from "@chakra-ui/react";
import Subscription from "../components/Subscription";
import Link from "next/link";

export default function Home() {
  // Load the top 25 most followed Lens profiles
  const { data, isLoading } = useQuery(
    ["mostFollowedProfiles"],
    mostFollowedProfiles
  );

  return (
    <>
      <div className={styles.container}>

        <div className="flex justify-start w-[100%]">
          <Link href='/transactionbuilder' className="rounded-md bg-red-600 text-white px-8 py-2">Use Transaction Builder</Link>
        </div>
        <div className={styles.iconContainer}>
          <Image
            src="/thirdweb.svg"
            height={75}
            width={115}
            className={styles.icon}
            alt="thirdweb"
          />
          <Image
            width={75}
            height={75}
            src="/lens.jpeg"
            className={styles.icon}
            alt="sol"
          />
        </div>
        <h1 className={styles.h1}>Lens SocialFI</h1>
        <p className={styles.explain}>
          Build a simple application using thirdweb and Lens!
        </p>

        <div className={styles.profileGrid}>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            data?.map((profile) => (
              <a
                href={`/profile/${profile.handle}`}
                className={styles.profileContainer}
                key={profile.id}
              >
                <MediaRenderer
                  src={profile?.picture?.original?.url || ""}
                  style={{
                    borderRadius: "50%",
                    width: "64px",
                    height: "64px",
                    objectFit: "cover",
                  }}
                />
                <h2 className={styles.profileName}>{profile.name}</h2>
                <p className={styles.profileHandle}>@{profile.handle}</p>
              </a>
            ))
          )}
          <Accordion defaultIndex={[1]} allowToggle mt={10} rounded="xl">
            <Messages />
            <Subscription />
          </Accordion>
        </div>
      </div>
    </>
  );
}

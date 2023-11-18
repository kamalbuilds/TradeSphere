import Profile from "../../types/Profile";
import { basicClient } from "../initClient";

export const getProfileQuery = `
query Profile {
    profile(request: { profileId: "0x06" }) {
      onChainIdentity {
        ens {
          name
        }
        proofOfHumanity
        sybilDotOrg {
          verified
          source {
            twitter {
              handle
            }
          }
        }
        worldcoin {
          isHuman
        }
      }
    }
  }
`;


/**
 * Load a user's profile by their handle.
 */
async function onchainidentity(handle: string): Promise<Profile> {
  const response = await basicClient
    .query(getProfileQuery, {
      handle,
    })
    .toPromise();
  return response.data.profile as Profile;
}

export default onchainidentity;

// https://docs.lens.xyz/docs/onchain-identity
import axios from 'axios';

export const fetchUniversalProfile = async (identity : string) => {
  try {
    const response = await axios.get(`https://api.web3.bio/profile/${identity}`);
    console.log(response.data,"resp")
    return response.data;
  } catch (error) {
    console.error('Error fetching universal profile:', error);
    return null;
  }
};

export const fetchENSProfile = async (identity : string) => {
  try {
    const response = await axios.get(`https://api.web3.bio/profile/ens/${identity}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ENS profile:', error);
    return null;
  }
};

export const fetchLensProfile = async (identity : string) => {
    try {
      const response = await axios.get(`https://api.web3.bio/profile/lens/${identity}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ENS profile:', error);
      return null;
    }
};

export const fetchFarcasterProfile = async (identity : string) => {
    try {
        const response = await axios.get(`https://api.web3.bio/profile/farcaster/${identity}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching ENS profile:', error);
        return null;
    }
};

export const fetchDotBitProfile = async (identity : string) => {
    try {
        const response = await axios.get(`https://api.web3.bio/profile/dotbit/${identity}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching ENS profile:', error);
        return null;
    }
};
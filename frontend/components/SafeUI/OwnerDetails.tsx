import React from 'react';
import { BsFillPersonFill } from "react-icons/bs";
import Image from 'next/image';
import AddressLabel from '../../helpers/AddressLabel';

const OwnerDetails = ({
    userInfo,
    ownerAddress
}: any) => {

    console.log("User Info", userInfo);

    return (
        <div>

            <div>
                <div className='flex flex-row gap-2 items-center ' >
                    <BsFillPersonFill className="h-[16px] w-[16px]" />
                    <p className='text-[14px] text-gray-400'>Owner Details</p>
                </div>
                <div className='mt-4'>
                    <p className='text-[34px] '>Owner Details</p>
                    <p className='text-[14px] text-gray-400'>Owner of the safe wallets</p>
                </div>
            </div>
            <div className='w-[auto] h-[2px] rounded-lg bg-zinc-800 '></div>


            {userInfo?.verifierId && (
                <div>
                    <div className='flex flex-col gap-4 my-8 '>
                        <p className='text-[24px]'>Profile</p>
                        <div className='flex flex-row items-center gap-2'>
                            <Image src={userInfo?.profileImage} width={50} height={50} className='rounded-full' alt='profile' />
                            <p>{userInfo?.name}</p>
                        </div>
                    </div>
                    <div className='w-[auto] h-[2px] rounded-lg bg-zinc-800 '></div>

                    <div className='flex flex-col gap-4 my-8'>
                        <p className='text-[24px]'>Email Id</p>
                        <p>{userInfo?.email}</p>
                    </div>
                </div>
            )}

            <div className='w-[auto] h-[2px] rounded-lg bg-zinc-800 '></div>



            <div className='flex flex-col gap-4 my-8 '>
                <p className='text-[24px]'>Owner Wallet Address</p>
                <AddressLabel address={ownerAddress} showBlockExplorerLink useFullAddress />
            </div>
        </div>
    );
};

export default OwnerDetails;
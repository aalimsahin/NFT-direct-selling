'reach 0.1';
"use strict";

const NftProps = Object({
  nftId: UInt,
  artistId: UInt,
  createdAt: Bytes(50), // Number of bytes that createdAt can take
  managerAddress: Address,
});

const AuctionProps = Object({
  nftPrice: UInt,
  timeout: UInt,
});

const BidderProps = {
  buyNft: Fun([UInt, UInt, UInt], Bool),
};

const OwnerInterface = {
  ...BidderProps,
  showOwner: Fun([UInt, UInt, Address], Null),
  informTimeout: Fun([], Null),
  getAuctionProps: Fun([], AuctionProps),  
};

const CreatorInterface = {
  ...OwnerInterface,
  getNftProps: Fun([], NftProps),
};

const emptyAuction = { 
  nftPrice: 0, timeout: 0
};

export const main = Reach.App(
  {},
  [ 
    Participant('Creator', CreatorInterface),
    ParticipantClass('Owner', OwnerInterface),
  ],
    (Creator, Owner) => {

    Creator.only(() => {
      const { nftId, artistId, createdAt, managerAddress } = declassify(interact.getNftProps());
    });

    Creator.publish(nftId, artistId, createdAt, managerAddress);

    var owner = Creator;
    invariant(balance() == 0);
    while (true) {
      commit();

      Owner.only(() => {
        const amOwner = this == owner;
        const { nftPrice, timeout } =
          amOwner ? declassify(interact.getAuctionProps()) : emptyAuction;
      });

      Owner.publish(nftPrice, timeout).when(amOwner).timeout(false);
      commit();

      Owner.only(() => {
        const buyNft = declassify(interact.buyNft(nftPrice, nftId, artistId)) && this != owner;
        const bidder = this;
      })

      Owner.publish(buyNft, bidder).pay(nftPrice).when(buyNft).timeout(timeout, () => {
        each([Creator, Owner], () => {
          interact.informTimeout();
        })
        Anybody.publish();
        [owner] = [owner];
        continue;
      });

      each([Creator,Owner], () => {
        interact.showOwner(nftId, nftPrice, bidder);
      });

      transfer((owner == Creator ? nftPrice * 15 / 100 : nftPrice * 5 / 100)).to(managerAddress); // I set it up according to the base contract.
      transfer((owner == Creator ? 0 : nftPrice / 10 )).to(Creator); // You need to write the amount in the first space and write to whom the amount will go in the second space. You can edit it later if you want to change it.
      transfer(balance()).to(owner);

      [owner] = [bidder];
      continue;
    };
    commit();
    exit();
}); 
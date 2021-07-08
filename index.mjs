import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';

(async () => {
  const stdlib = await loadStdlib();
  const startingBalance = stdlib.parseCurrency(10); // Start Balance
  const fmt = (x) => stdlib.formatCurrency(x, 4);
  const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

  const accCreator  = await stdlib.newTestAccount(startingBalance);
  const accAlice    = await stdlib.newTestAccount(startingBalance);

  const beforeCreator = await getBalance(accCreator);
  const beforeAlice = await getBalance(accAlice);

  console.log("|-----------------------------------------------------------------------------------------------|");
  console.log(` Creator has ${beforeCreator} Algo`);
  console.log(` Alice has ${beforeAlice} Algo`);
  console.log("|-----------------------------------------------------------------------------------------------|");

  async function later() {
    const afterCreator = await getBalance(accCreator);
    const afterAlice = await getBalance(accAlice);

    console.log(` Creator went from ${beforeCreator} Algo to ${afterCreator} Algo`);
    console.log(` Alice went from ${beforeAlice} Algo to ${afterAlice} Algo`);
    console.log("|-----------------------------------------------------------------------------------------------|");
  
  }

  const ctcCreator = accCreator.deploy(backend);

  const nftProps = {
    nftId: stdlib.randomUInt(), //Random NFT ID
    artistId: stdlib.randomUInt(), // Random Artist ID
    createdAt: "Dartroom", 
    managerAddress: accCreator.networkAccount.addr, // For Etheruem, You have to do "acc.networkAccount.address" - For Algorand, You have to do "acc.networkAccount.addr"
  };

  const auctionProps = {
    ' Creator': {
      nftPrice: stdlib.parseCurrency(5), // Price of NFT
      timeout: 20, // Deadline
    },
  };

  const trades = {
    trade: 0,
  };

  const makeOwner = (acc, who) => {
    const ctc = acc.attach(backend, ctcCreator.getInfo());
    return backend.Owner(ctc, {
      showOwner: ((nftId, nftPrice, owner) => {
        if ( stdlib.addressEq(owner, acc.networkAccount.addr) ) {  // For Etheruem, You have to do "acc.networkAccount.address" - For Algorand, You have to do "acc.networkAccount.addr"
          console.log("|-----------------------------------------------------------------------------------------------|");
          console.log(` New owner is (Alice) ${owner}\n NFT Price: ${fmt(nftPrice)} Algo\n NFT ID: #${nftId}`);
          console.log("|-----------------------------------------------------------------------------------------------|");
          trades.trade += 1;
        };
      }),
      async getAuctionProps() {
        if( trades.trade > 1){ // If you want to increase the number of trades, you should also add Alice to the auctionProps.
          await later();
          process.exit(0);
        }
        console.log("|-----------------------------------------------------------------------------------------------|");
        console.log(`${who} set the selling price of NFT as ${fmt(auctionProps[who].nftPrice)} Algo`);
        console.log("|-----------------------------------------------------------------------------------------------|");
        return auctionProps[who];
      },
      buyNft: (nftPrice, nftId, artistId) => {
        if (trades.trade<1) {
          trades.trade += 1;
          console.log(` NFT ID: #${nftId}\n Artist ID: #${artistId}\n NFT Price: ${fmt(nftPrice)} Algo`)
        }
        return true;
      },
      informTimeout: () => {
        console.log(`Buyer didn't pay for NFT.`)
      }
    });
  };

  await Promise.all([
    backend.Creator(
      ctcCreator,
      { getNftProps: (() => {
        console.log(` Creator makes id #${nftProps.nftId}`);
        console.log(` Artist id #${nftProps.artistId}`);
        console.log(` CreatedAt: ${nftProps.createdAt}`);
        console.log(` Manager Address: ${nftProps.managerAddress}`);
        return nftProps; }),
        showOwner: ((nftId, nftPrice, owner) => {}),
      },
    ),
    
    makeOwner(accCreator , ' Creator'),    
    makeOwner(accAlice, '   Alice'),
  ]);
})();
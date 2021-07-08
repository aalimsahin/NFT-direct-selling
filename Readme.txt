Just to run the contract: ./reach compile

To run on Ethereum with the mjs file: ./reach run (The places I specified in the mjs file should be "address")

To run on Algorand with the mjs file: ./reach run (The places I specified in the mjs file should be "addr")

If you get a "bad request" error, you should use the "./reach docker-reset" command. Then it will be fixed.

If the rsh file is not readable:
Create a new folder named ".vscode" inside the folder.
Create a file named "settings.json" inside it.
If you write " {"files.associations":{"*.rsh":"javascript"}} " in it, the problem will be solved.


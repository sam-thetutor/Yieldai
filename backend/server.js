import dotenv from "dotenv";
import express from "express";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, PrivateKey, PrivateKeyVariants } from "@aptos-labs/ts-sdk";
import { AgentRuntime, createAptosTools, LocalSigner } from "move-agent-kit";


dotenv.config();

const PORT = process.env.PORT || 3012;

const app = express();

//create a new account
const newAccount = Account.generate();
console.log("New account address:", newAccount.accountAddress?.toString());

const aptosConfig = new AptosConfig({
	network: Network.DEVNET,
});
const aptos = new Aptos(aptosConfig);

// Format the private key as recommended by the warning
const formattedPrivateKey = PrivateKey.formatPrivateKey(
	process.env.PRIVATE_KEY,
	PrivateKeyVariants.Ed25519
);

const account = Account.fromPrivateKey({
	privateKey: new Ed25519PrivateKey(formattedPrivateKey)
});
//fund the account

async function setupAccount() {
	try {
		// Fund the account
		await aptos.fundAccount({
			accountAddress: newAccount.accountAddress?.toString(),
			amount: 100000000 // 1 APT
		});
		console.log("Account funded successfully");

		// Wait a bit for funding to complete
		await new Promise(resolve => setTimeout(resolve, 2000));

		const signer = new LocalSigner(newAccount, Network.DEVNET);
		const agent = new AgentRuntime(signer, aptos, {
			OPENAI_API_KEY: process.env.OPENAI_API_KEY
		});

		console.log("Account address:", newAccount.accountAddress?.toString());

		// Transfer APT tokens
		const toAddress = "0xb1f8ab7ed04e099b14350e05b41116e2bf52cea7a86c8797885e6a902dd280d9";
		
		try {
			const transferResults = await agent.transferTokens(
				toAddress,  // to address
				"1000000", // amount in octas (0.01 APT)
				"0x1::aptos_coin::AptosCoin" // coin type
			);
			console.log("Transfer Results:", transferResults);
		} catch (error) {
			console.error("Transfer Error:", error);
		}
	} catch (error) {
		console.error("Setup Error:", error);
	}
}

// Run the setup and transfer
setupAccount();

//start server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
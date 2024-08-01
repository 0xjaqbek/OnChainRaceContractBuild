import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type RaceConfig = {};

export function onChainRaceConfigToCell(config: RaceConfig): Cell {
    return beginCell().endCell();
}

export class Race implements Contract {
    static RaceConfigToCell: any;
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Race(address);
    }

    static createFromConfig(config: RaceConfig, code: Cell, workchain = 0) {
        const data = onChainRaceConfigToCell(config);
        const init = { code, data };
        return new Race(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendSetData(provider: ContractProvider, via: Sender, value: bigint, time: number, userAddress: Address) {
        console.log(`sendSetData called with time: ${time}, userAddress: ${userAddress.toString()}`);
        const body = beginCell()
            .storeUint(1, 32) // op code
            .storeUint(time, 64)
            .storeRef(beginCell().storeAddress(userAddress).endCell())
            .endCell();

        await provider.internal(via, {
            value,
            body,
        });
    }

    async getLeaderboard(provider: ContractProvider): Promise<Cell> {
        const { stack } = await provider.get('get_leaderboard', []); // No arguments needed
        return stack.readCell(); // Read Cell from stack
    }
}

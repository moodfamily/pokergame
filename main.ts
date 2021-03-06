import prompts from 'prompts';
import { PokerEvaluator } from './pokerEvaluator';
import fs from 'fs';
import path from 'path';

declare const __TEST__: any;
declare const process: any;

const [ , , , fileName ] = process.argv;

export const validateInput = (value: string) => {
    const v = value.toUpperCase();
    if (v.length !== 11) {
        return 'Each hand must be exactly five cards separated by space';
    }
    const [hand1, hand2] = v.split(' ');
    const regex = new RegExp(/^(?=.{5}$)[2-9,TJKQA]*\*?[2-9,TJKQA]*$/);
    const counts = [...value.toUpperCase()].reduce((accumulated, current) => {
        if (accumulated[current]) {
            return { ...accumulated, [current]: accumulated[current] + 1 };
        }
        return { ...accumulated, [current]: 1 };
    }, {});
    if (!regex.test(hand1)) {
        return `this hand: ${hand1} is not valid`;
    }
    if (!regex.test(hand2)) {
        return `this hand: ${hand2} is not valid`;
    }
    if (Object.values(counts).find(c => c > 4)) {
        return `Hey, you are cheating`;
    }
    return true;
};

const buildOptions = (answer) => <unknown>new Array(answer).fill('').map((_, idx) => ({
    type: 'text',
    name: `pokerHands${idx}`,
    message: `Please input two hands separated by space, ${idx}:`,
    validate: validateInput
}));

if (typeof __TEST__ === 'undefined' && !fileName) {
    (async () => {
        let response;
        await prompts([
            {
                type: 'number',
                name: 'value',
                message: 'How many hands would you like to evaluate?',
                validate: value => Number.isInteger(value) && value < Math.pow(10, 5)
            }
        ], {
            onSubmit: async (prompt, answer) => {
                const options = buildOptions(answer) as prompts.PromptObject;
                response = await prompts(options);
                new PokerEvaluator(Object.values(response));
            }
        });
    })();
}

if (fileName) {
    const input = fs.readFileSync(path.resolve(fileName), { encoding: 'utf8' }).split('\n');
    input.forEach((i, idx) => {
        if (!validateInput(i)) {
            console.error(`input: ${i} at line ${idx} is invalid`);
            throw('error');
        }
    });
    new PokerEvaluator(input);
}

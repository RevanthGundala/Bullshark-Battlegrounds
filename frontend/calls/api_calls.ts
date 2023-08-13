import { Wallet } from "ethos-connect";
import { MODULE_ADDRESS } from "../constants";

//  
export const get_object_ids = async (
    wallet: Wallet | undefined, 
    object_name: string): Promise<string[][]> => {
    try{
        const response = await fetch(
            `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "suix_getOwnedObjects",
                    "params": [
                        wallet?.address,
                        {
                            "filter": {
                                "MatchAll": [
                                    {
                                        "StructType": `${MODULE_ADDRESS}::card_game::${object_name}`
                                    }
                                ]
                            }
                        }
                    ],
                    "id": 1
                })
            }
        );
        const data = await response.json();
        const tempChallenges: string[] = data?.result?.data?.map((item: { data: { objectId: string } }) => item.data.objectId);
        const tempChallengers: string[] = await Promise.all(
            tempChallenges.map((id: string) => get_object_from_id(wallet, id, object_name))
        );
        return[tempChallenges, tempChallengers];
    } catch (error) {
        console.log(error);
        return [];
    }
}

export const get_object_from_id = async (
    wallet: Wallet | undefined, 
    id: string, 
    object_name: string) => {
    try{
        const response = await fetch(
            `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "sui_getObject",
                    "params": [
                        id,
                        {
                            "showType": true,
                            "showOwner": true,
                            "showPreviousTransaction": true,
                            "showDisplay": false,
                            "showContent": true,
                            "showBcs": false,
                            "showStorageRebate": true
                          }
                    ],
                    "id": 1
                })
            }
        );
        const data = (await response.json()).result.data.content.fields;
        return object_name === "Challenge" ? data.challenger : data.game;
    } catch (error) {
        console.log(error);
    }
}

export const listen_for_events = async() => {
    const response = await fetch(
        `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "suix_queryEvents",
                "params": [
                    {
                      "MoveModule": {
                        "package": MODULE_ADDRESS,
                        "module": "card_game"
                      }
                    }
                  ]
                })
            });
    const data = await response.json();
    console.log("event data:" + data);
}


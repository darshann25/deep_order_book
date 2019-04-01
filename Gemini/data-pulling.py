import requests, json
import pandas as pd

def main():
    orderbook = getGeminiData(10000)
    print("Orderbook received")
    orderbook["quantity"] = orderbook["quantity"].astype(float)
    orderbook["price"] = orderbook["price"].astype(float)
    
    orderbook.to_csv("./orderbook_data.csv")

    pivot_ob = orderbook.pivot_table(index = "price",columns="type",values="quantity")
    pivot_ob.to_csv("./pivoted_orderbook.csv")


def getGeminiData(num_records=1000):
    orderbook = pd.DataFrame(columns=["timestamp","price","quantity","type","exchange"])
    iterations = int((num_records / 1000)) 

    for i in range(iterations):
        resp = requests.get("https://api.gemini.com/v1/book/btcusd?limit_bids=500&limit_asks=500").json()
        # data = pd.DataFrame(columns=["timestamp","price","quantity","type","exchange"])
        bids = resp["bids"]
        asks = resp["asks"]


        for m in range(500):
            index = (i * 1000) + m
            print(index)
            orderbook.loc[index] = [bids[m]["timestamp"], bids[m]["price"], bids[m]["amount"], "bids", "gemini"]
            orderbook.loc[index + 500] = [asks[m]["timestamp"], asks[m]["price"], asks[m]["amount"], "asks", "gemini"]
            
    print(len(orderbook))
    return orderbook

main()

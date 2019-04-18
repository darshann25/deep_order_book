import sys
import pandas as pd
import json


def process(data_filename):
    path = "./data/"
    print("Looking in {} for file with name {}".format(path, data_filename))
    raw_data = pd.read_csv(path + data_filename)
    clean_data = []
    print("processing started...")
    for _, item in raw_data.iterrows():
        data = json.loads(item["data"])
        bids = data["bids"]
        asks = data["asks"]
        if item["exchange"] == "gemini":
            for bid in bids:
                tmp = []
                tmp.append(item["exchange"]) 
                tmp.append(int(bid["timestamp"]))
                tmp.append(bid["price"])
                tmp.append(bid["amount"])
                tmp.append("bid")
                clean_data.append(tmp)
            
            for ask in asks:
                tmp = []
                tmp.append(item["exchange"]) 
                tmp.append(int(ask["timestamp"]))
                tmp.append(ask["price"])
                tmp.append(ask["amount"])
                tmp.append("ask")
                clean_data.append(tmp)

        if item["exchange"] == "coinbase":
            for bid in bids:
                tmp = []
                tmp.append(item["exchange"])
                tmp.append(item["created_at"])
                tmp.append(bid[0]) # price
                tmp.append(bid[1]) # amount (volume)
                tmp.append("bid")
                clean_data.append(tmp)
            for ask in asks:
                tmp = []
                tmp.append(item["exchange"])
                tmp.append(item["created_at"])
                tmp.append(ask[0]) # price
                tmp.append(ask[1]) # amount (volume)
                tmp.append("ask")
                clean_data.append(tmp)

    columns = ["exchange", "timestamp", "price", "amount", "action"]
    df = pd.DataFrame(clean_data, columns=columns)

    df['timestamp'] = pd.to_numeric(df['timestamp'],errors='coerce')
    df['price'] = pd.to_numeric(df['price'],errors='coerce')
    df['amount'] = pd.to_numeric(df['amount'],errors='coerce')
    df.fillna(0)

    pivot_df = df.pivot_table(index = "timestamp",columns="price",values="amount")
    clean_df = pivot_df.fillna(0)

    clean_data_filename = "clean_" + data_filename
    clean_data_file_path = path + clean_data_filename
    
    print("processing complete.")
    print("Writing clean file to ", clean_data_file_path)
    clean_df.to_csv(clean_data_file_path)


    

if __name__ =='__main__':
    args = sys.argv
    raw_data_filename = args[1]
    process(raw_data_filename)
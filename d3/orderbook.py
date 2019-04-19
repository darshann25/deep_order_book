import pandas as pd
import requests
import datetime
import time

import numpy as np
import matplotlib.pyplot as plt
import copy

import csv

resp = {}
bids = {}
asks = {}
order_book = {}
order_book_t = {}
data_to_write = {}
for coin in ['BTC-USD']:#,'ETH-USD','BCH-USD','LTC-USD','ETC-USD']:
    data_to_write[coin] = pd.DataFrame()


for coin in ['BTC-USD']:#,'ETH-USD','BCH-USD','LTC-USD','ETC-USD']:
    print('fetching {}'.format(coin))
    resp[coin] = requests.get('https://api.pro.coinbase.com/products/{}/book?level=3'.format(coin)).json()

########## Setup an events panda dataframe to hold all the data:
# Events:
#   ts: Timestamp of the order received by client.
#   size: Order size
#   price: Price of order
#   is_bid: Is the order a buy or sell
##########
#current_ts = datetime.datetime.now()
current_ts = datetime.datetime.utcnow().timestamp()

events_bid = pd.DataFrame.from_records(resp[coin]['bids'], columns=['price','size','order_id'], exclude=['order_id'])
events_bid['ts'] = current_ts
events_bid['is_bid'] = 'bid'
events_ask = pd.DataFrame.from_records(resp[coin]['asks'], columns=['price','size','order_id'], exclude=['order_id'])
events_ask['ts'] = current_ts
events_ask['is_bid'] = 'ask'
events = events_bid.append(events_ask, ignore_index=True)

#Format to numeric
cols = ['price', 'size']
events[cols] = events[cols].apply(pd.to_numeric, errors='coerce', axis=1)


#Print data to CSV for testing in histogram orderbook
events.to_csv("BTC_Histogram.csv", index=False)

#Plot
prices = np.array(events["price"])
plt.hist(prices,bins=10000,histtype='step')
plt.title("Price distribution")
plt.show()

# Zoom in on primary bin, reject the outliers
def reject_outliers(data, m = 2.):
    d = np.abs(data - np.median(data))
    mdev = np.median(d)
    s = d/mdev if mdev else 0.
    return data[s<m]

rejected = reject_outliers(prices, m=4)
plt.hist(rejected)
plt.title("Outliers rejected")
plt.show()

# Pie chart of bid ask ratio, not weighted by order size
bids = events[events.is_bid == "bid"].shape[0]
asks = events[events.is_bid == "ask"].shape[0]

plt.pie([bids, asks])
plt.legend(["bids", "asks"])
plt.title("bid/ask")
plt.show()



# Plot Order Book
def plot_ob(bidask, bps=.25):
    # bps: basis points
    best_bid = max(bidask["bids"].keys())
    best_ask = min(bidask["asks"].keys())
    worst_bid = best_bid * (1 - bps)
    worst_ask = best_bid * (1 + bps)
    
    # Attempt to seperate them
    #bids_to_sort = filter(lambda (k,v): k >= worst_bid, bidask['bids'].items())
    #asks_to_sort = filter(lambda (k,v): k <= worst_ask, bidask['asks'].items())
    #filtered_bids = sorted(bids_to_sort, key=lambda x:-x[0])
    #filtered_asks = sorted(asks_to_sort, key=lambda x:+x[0])
    
    #filtered_bids = sorted(filter(lambda (k,v): k >= worst_bid, bidask['bids'].items()), key=lambda x:-x[0])
    #filtered_asks = sorted(filter(lambda (k,v): k <= worst_ask, bidask['asks'].items()), key=lambda x:+x[0])

    bsizeacc = 0
    bhys = []    # bid - horizontal - ys
    bhxmins = [] # bid - horizontal - xmins
    bhxmaxs = [] # ...
    bvxs = []
    bvymins = []
    bvymaxs = []
    asizeacc = 0
    ahys = []
    ahxmins = []
    ahxmaxs = []
    avxs = []
    avymins = []
    avymaxs = []
    
    for (p1, s1), (p2, s2) in zip(filtered_bids, filtered_bids[1:]):
        bvymins.append(bsizeacc)
        if bsizeacc == 0:
            bsizeacc += s1
        bhys.append(bsizeacc)
        bhxmins.append(p2)
        bhxmaxs.append(p1)
        bvxs.append(p2)
        bsizeacc += s2
        bvymaxs.append(bsizeacc)
    
    for (p1, s1), (p2, s2) in zip(filtered_asks, filtered_asks[1:]):
        avymins.append(asizeacc)
        if asizeacc == 0:
            asizeacc += s1
        ahys.append(asizeacc)
        ahxmins.append(p1)
        ahxmaxs.append(p2)
        avxs.append(p2)
        asizeacc += s2
        avymaxs.append(asizeacc)
        
    plt.hlines(bhys, bhxmins, bhxmaxs, color="green")
    plt.vlines(bvxs, bvymins, bvymaxs, color="green")
    plt.hlines(ahys, ahxmins, ahxmaxs, color="red")
    plt.vlines(avxs, avymins, avymaxs, color="red")
    
# d_ts = max(ob.keys())
# d_ob = ob[d_ts]
d_ob = resp[coin]
plt.figure(figsize=(10,4))
plot_ob(d_ob, bps=.05)
plt.ylim([0, 17500])
plt.show()
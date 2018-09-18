let server;
const request = require('supertest');
const mongoose = require('mongoose');
const {Orderbook} = require('../../models/orderbook');

describe('/api/orderbooks', () => {

	beforeEach(() => {
		server = require('../../index');
	});

	afterEach(async () => {
		server.close();
		await Orderbook.remove({});
	})

	describe('GET /', async () => {


		it('should return all Orderbooks',async ()=>{		
			await Orderbook.collection.insertMany([
				{fundAmount: 2000,
                coin_pairs: [{
                    coin_name: "BTC",
                    trading_pair:"EUR/BTC",
                    weight:0.2,
                    amount: 123.9,
                    action: "BUY",
                    coin_price: 5.3
                }]},
				{fundAmount: 3000,
                coin_pairs: [{
                    coin_name: "BTC",
                    trading_pair:"EUR/BTC",
                    weight:0.2,
                    amount: 10.1,
                    action: "BUY",
                    coin_price: 10.1
                },
                {
                    coin_name: "ETH",
                    trading_pair:"EUR/ETH",
                    weight:0.2,
                    amount: 10.5,
                    action: "BUY",
                    coin_price: 10.5
                }]}
            ]);
            
			const res = await request(server).get('/api/orderbooks/');

			expect(res.status).toBe(200);
			expect(res.body.some(o => o.fundAmount === 2000)).toBeTruthy();
            expect(res.body.some(o => o.fundAmount === 3000)).toBeTruthy();
        })
    })

    describe('/POST', () => {
        const exec = async () => {
			return await request(server)
			.post('/api/orderbooks')
			.send({
                "fundAmount": 20000000,
                "index": {
                  "type": "index_value",
                  "data":
                    {
                      "timestamp": "2018-07-19T20:49:07.000Z",
                      "index_id": "B20",
                      "value": "4925.6454833015190000",
                      "assets": {
                        "XMR": {
                          "price": 139.16501244878754,
                          "weight": 0.014110601057505709
                        },
                        "LSK": {
                          "price": 5.341053022048183,
                          "weight": 0.0036415580019086144
                        },
                        "ADA": {
                          "price": 0.18234891163352426,
                          "weight": 0.029205474474645287
                        },
                        "BTC": {
                          "price": 7406.97681309931,
                          "weight": 0.28898428690678335
                        },
                        "IOTA": {
                          "price": 1.0372277248287078,
                          "weight": 0.019737429497963206
                        },
                        "XEM": {
                          "price": 0.1865177638849437,
                          "weight": 0.010668337602888515
                        },
                        "LTC": {
                          "price": 86.64077733117117,
                          "weight": 0.030039256051863868
                        },
                        "TRX": {
                          "price": 0.03793040716000889,
                          "weight": 0.016438822719143365
                        },
                        "XRP": {
                          "price": 0.4764023375576128,
                          "weight": 0.11393957809976198
                        },
                        "ZEC": {
                          "price": 199.97077034508507,
                          "weight": 0.004934389729883638
                        },
                        "ONT": {
                          "price": 3.554578387795866,
                          "weight": 0.0035593102979574512
                        },
                        "EOS": {
                          "price": 8.288919231319548,
                          "weight": 0.049854315915214734
                        },
                        "OMG": {
                          "price": 7.644353615494538,
                          "weight": 0.004690633733081339
                        },
                        "ETH": {
                          "price": 465.5120645410919,
                          "weight": 0.24187944430292269
                        },
                        "VEN": {
                          "price": 1.7949235794618295,
                          "weight": 0.006706025589002236
                        },
                        "XLM": {
                          "price": 0.3070573522541129,
                          "weight": 0.034451447882987866
                        },
                        "BCH": {
                          "price": 814.1876480979554,
                          "weight": 0.08953197521789123
                        },
                        "ETC": {
                          "price": 17.46218542476992,
                          "weight": 0.009857556450819885
                        },
                        "DASH": {
                          "price": 257.52235899982475,
                          "weight": 0.012261281549165084
                        },
                        "NEO": {
                          "price": 35.93343306365542,
                          "weight": 0.015508274918609906
                        }
                      }
                    }
                }
            });
        }
        
        it('should return a CSV type header', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
			expect(res.headers['content-type']).toBe("text/csv; charset=utf-8");
		})
    })
})
# Voting decrypt service

## How to deploy

1. Create empty databases
2. Specify listed below environment variables with your values:

   ```
   # balance
   BALANCE_WATCHER_ENABLED=true # enable money transfer
   MAIN_WALLET_PRIVATE_KEY=<walletPrivKey> # Keypair for money transfer
   MAIN_WALLET_PUBLIC_KEY=<walletPubKey> # Keypair for money transfer
   SERVICE_TRANSFER_AMOUNT=1000 # amount of money transfered to decrypts (WEST)
   MINIMAL_SERVICE_BALANCE=1000 # minimal decrypt service balance (WEST)
   POSSIBLE_VOTES_NUM=10 #send amount of money enough for N votes

   # common settings
   PORT=3005
   HOSTNAME=decrypt-0  # index of current decrypt
   DKG_STEP_TIMEOUT=90000 # period while service wait commit, scalar, shadows
   TX_SUCCESS_INTERVAL=60000  # period while service wait "success" response from node
   VOTING_HOLD_TIMEOUT=15000  # voting holds this timeout after error
   DEAD_VOTING_TIMEOUT=120000 # remove voting if no actions happens
   DEAD_CRAWLER_TIMEOUT=300000 # crawler health check
   BULLETINS_CHUNK_SIZE=5000  # number of votes in one chunk sent to cryptolib
   BLIND_SIGNATURE_VERIFY=true # verify blind signature
   BLIND_SIGNATURE_CHUNK_SIZE=16 # amount of votes in chunk to verify
   ROLLBACK_CHECK_BLOCKS_AMOUNT=10000 # number of blocks to check between local db and crawler
   MIN_DATE_START_INTERVAL=300000 # deny to initiate voting if dateStart less than current time + N ms
   LOG_LEVEL=error, warn, log, debug  # logging level of service
   SWAGGER_BASE_PATH=["/","/","/"] # array of base paths of services

   # contract settings
   CONTRACT_TYPE=common # type of voting contract
   CONTRACT_IMAGE=<contractImage>
   CONTRACT_IMAGE_HASH=<contractImageHash>

   # server cofiguration
   # 0b01 - DECRYPT, 0b10 - MAIN
   SERVER_CONFIG = [3, 1, ...]

   #salt for encrypting keys in database
   ENCRYPT_PRIVATE_KEYS_SALT=<salt>

   # keys of all servers
   PRIVATE_KEY=["<privKey1>", "<privKey2>", ...]
   PUBLIC_KEY=["<pubKey1>", "<pubKey2>, ...]
   SERVICE_TOKEN=["<token1>", "<token2>", ...]

   # service`s db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=<password>
   POSTGRES_DB=["<dbname>", "<dbname>", ...]
   POSTGRES_PORT=<port>
   POSTGRES_HOST=<host>
   POSTGRES_ENABLE_SSL=true

   # blockchain
   CRAWLER_LAG=1
   CRAWLER_POSTGRES_USER=postgres
   CRAWLER_POSTGRES_PASSWORD=<password>>
   CRAWLER_POSTGRES_DB=["<dbname>", "<dbname>", ...]
   CRAWLER_POSTGRES_PORT=<port>
   CRAWLER_POSTGRES_HOST=<host>
   CRAWLER_POSTGRES_ENABLE_SSL=true

   # cryptolib url
   CRYPTO_SERVICE_ADDRESS=["http://<host>:<port>/<path>", "http://<host>:<port>/<path>", ...]

   # node url
   NODE_ADDRESS=http://<host>:<port>/<path>

   # auth service url
   AUTH_SERVICE_ADDRESS=http://<host>:<port>/<path>

   ```

   Where vars below is JSON array:

   ```
   SERVER_CONFIG
   POSTGRES_DB
   SERVICE_TOKEN
   PRIVATE_KEY
   PUBLIC_KEY
   ```

3. Run docker

## Environment params list
###Required
```
POSTGRES_USER - string
POSTGRES_PASSWORD - string
POSTGRES_DB - json array of strings for each decrypt instance 
POSTGRES_PORT - string
POSTGRES_HOST - string
CRAWLER_POSTGRES_USER - string
CRAWLER_POSTGRES_PASSWORD - string
CRAWLER_POSTGRES_DB - json array of strings for each decrypt instance
CRAWLER_POSTGRES_PORT - number
CRAWLER_POSTGRES_HOST - string
CRYPTO_SERVICE_ADDRESS - json array of strings for each decrypt instance 
NODE_ADDRESS - string
AUTH_SERVICE_ADDRESS - string
PRIVATE_KEY - json array of strings for each decrypt instance
PUBLIC_KEY - json array of strings for each decrypt instance
SERVICE_TOKEN - json array of strings for each decrypt instance
CONTRACT_TYPE - blind or common
CONTRACT_IMAGE - string
CONTRACT_IMAGE_HASH - string
SERVER_CONFIG - json array of numbers to specify instances and its roles. Work 
MAIN_WALLET_PUBLIC_KEY - string
MAIN_WALLET_PRIVATE_KEY - string
SERVICE_TRANSFER_AMOUNT - number
MINIMAL_SERVICE_BALANCE - number
ENCRYPT_PRIVATE_KEYS_SALT - string
```
###Optional
```
HOSTNAME - string like "decrypt-0". Where 0 - id of instance. 
PORT - number. If not specified web server will not be started
POSTGRES_ENABLE_SSL - boolean
CRAWLER_POSTGRES_ENABLE_SSL - boolean
BLIND_SIGNATURE_VERIFY -  boolean
BALANCE_WATCHER_ENABLED - boolean
TX_SUCCESS_TIMEOUT - number (default 60000),
VOTING_HOLD_TIMEOUT - number (default 15000),
DEAD_VOTING_TIMEOUT - number (default 1200000),
DKG_STEP_TIMEOUT - number (default 300000),
POSSIBLE_VOTES_NUM - number (default 1),
BULLETINS_CHUNK_SIZE - number (default 5000),
MIN_DATE_START_INTERVAL - number (default 300000),
CRAWLER_LAG - number (default 5),
ROLLBACK_CHECK_BLOCKS_AMOUNT - number (default 1000),
BLIND_SIGNATURE_CHUNK_SIZE - number (default 8),
DEAD_CRAWLER_TIMEOUT -  number default(300000)
CONTRACT_NAME - string. Used only for dev. If specified decrypt will process only contracts with this name.
LOG_LEVEL - list of showed log levels. E.g error, warn, log, debug
NODE_ENV - development or production (default: production)
```

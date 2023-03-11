git pull
npm install && npm run build
cd server
pid=`lsof -i:8877 | awk '{print $2}' | awk -F"/" '{ print $1 }' | grep -v PID | head -n 1 `
echo $pid
if [ ! -z $pid ]; then
    echo "kill process $pid"
    kill  $pid
fi
nohup python3 main.py &
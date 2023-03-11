
mkdir -p fast_label_sdk
cp -rf public fast_label_sdk/
cp -rf server/* fast_label_sdk/
rm -f fast_label_sdk/annotator.db
rm -f fast_label_sdk/config/*.ini
sed -i '' "s#../../public#../public#g" fast_label_sdk/app/__init__.py
cat > fast_label_sdk/config/production.ini <<EOF
[mysql]
USE_SQLITE= on
EOF

tar zcvf fast_label_sdk.tar.gz fast_label_sdk/
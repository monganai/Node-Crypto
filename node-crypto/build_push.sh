docker build . -t localhost:32000/node-crypto:discord
docker push localhost:32000/node-crypto:discord
cd ../
cd k8s/
microk8s.kubectl delete -f node-crypto.yaml
microk8s.kubectl apply -f node-crypto.yaml
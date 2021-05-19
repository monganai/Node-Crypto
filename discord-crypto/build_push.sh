docker build . -t localhost:32000/discord-crypto:discord
docker push localhost:32000/discord-crypto:discord
cd ../
cd k8s/
microk8s.kubectl delete -f discord-crypto.yaml
microk8s.kubectl apply -f discord-crypto.yaml
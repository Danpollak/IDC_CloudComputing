#!/bin/sh

# create key
aws ec2 create-key-pair --key-name ex1 --query 'KeyMaterial' --output text > MyKeyPair.pem

# create instances
INSTANCE1=`aws ec2 run-instances --image-id ami-0de53d8956e8dcf80 --count 1 --instance-type t2.micro --key-name MyKeyPair --placement AvailabilityZone=us-east-1a --output json | jq '.Instances[0].InstanceId' | tr -d '"'`
INSTANCE2=`aws ec2 run-instances --image-id ami-0de53d8956e8dcf80 --count 1 --instance-type t2.micro --key-name MyKeyPair --placement AvailabilityZone=us-east-1b --output json | jq '.Instances[0].InstanceId' | tr -d '"'`

# Create HTTP load balancer (no need for something more complex than this)
aws elb create-load-balancer --load-balancer-name myLoadBalancer --listeners "Protocol=HTTP,LoadBalancerPort=80,InstanceProtocol=HTTP,InstancePort=80" --availability-zones "us-east-1a" "us-east-1b"

# Attach instances
aws elb register-instances-with-load-balancer --load-balancer-name myLoadBalancer --instances $INSTANCE1 $INSTANCE2

# create auto scaling group
# aws autoscaling create-auto-scaling-group --auto-scaling-group-name MyAutoscale --max-size 5 --min-size 1 --desired-capacity 2 --availability-zones "us-east-1a" "us-east-1b"
# `aws autoscaling attach-instances --auto-scaling-group-name MyAutoscale --instance-ids ${INSTANCE1},${INSTANCE2}`

#!/bin/bash

# Test if is Root
if [[ $(id -u) -ne 0 ]] ; then echo "Please run as root" ; exit 1 ; fi

sleep .5
echo -ne "\x00\x00\x00\x28\x00\x00\x00\x00" > /dev/hidg0
echo -ne "\x00\x00\x00\x00\x00\x00\x00\x00"  > /dev/hidg0

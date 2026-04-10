#!/bin/bash
curl -sf http://localhost:8000/health > /dev/null || exit 1

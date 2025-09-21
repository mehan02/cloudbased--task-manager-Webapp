#!/bin/sh

# Replace environment variables in built files
if [ ! -z "$REACT_APP_API_URL" ]; then
    echo "Setting API URL to: $REACT_APP_API_URL"
    # Replace the localhost API URL with the actual API URL
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|http://localhost:8081/api|$REACT_APP_API_URL|g" {} \;
fi

# Execute the main container command
exec "$@"
#!/bin/bash
# Setup TOTP MFA for sudo commands

# Install Google Authenticator PAM module
if [[ -f /etc/debian_version ]]; then
    sudo apt-get update
    sudo apt-get install -y libpam-google-authenticator
elif [[ -f /etc/redhat-release ]]; then
    sudo yum install -y google-authenticator
else
    echo "Unsupported OS. Exiting."
    exit 1
fi

# Configure PAM to use TOTP for sudo
echo "auth required pam_google_authenticator.so" | sudo tee -a /etc/pam.d/sudo > /dev/null

# Enable challenge-response authentication
sudo sed -i 's/^#ChallengeResponseAuthentication no/ChallengeResponseAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/^ChallengeResponseAuthentication no/ChallengeResponseAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH service to apply changes
if systemctl list-units --full -all | grep -q "sshd.service"; then
    sudo systemctl restart sshd
else
    sudo service ssh restart
fi

# Prompt each user to set up their TOTP MFA
for user in $(ls /home); do
    sudo -u "$user" google-authenticator -t -d -f -r 3 -R 30 -w 3
    echo "MFA setup complete for user: $user"
done

# Ensure sudo requires MFA
echo "Defaults        env_reset, timestamp_timeout=30" | sudo tee -a /etc/sudoers > /dev/null
echo "Defaults        pwfeedback" | sudo tee -a /etc/sudoers > /dev/null
echo "Defaults        authenticate" | sudo tee -a /etc/sudoers > /dev/null

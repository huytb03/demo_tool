const fs = require("fs");
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");

const configPath = path.join(process.cwd(), "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

class BabyDoge {
  constructor() {
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://babydogepawsbot.com",
      Referer: "https://babydogepawsbot.com/",
      "Sec-Ch-Ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    };
    this.line = "~".repeat(42).white;
  }

  async waitWithCountdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục =====`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("");
  }


  log(msg) {
    const time = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    console.log(`[zepmoo] [${time}] | ${msg}`.cyan);
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async title() {
    console.clear();
    console.log(`
                        ███████╗███████╗██████╗ ███╗   ███╗ ██████╗ 
                        ╚══███╔╝██╔════╝██╔══██╗████╗ ████║██╔═══██╗
                          ███╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║
                         ███╔╝  ██╔══╝  ██╔═══╝ ██║╚██╔╝██║██║   ██║
                        ███████╗███████╗██║     ██║ ╚═╝ ██║╚██████╔╝
                        ╚══════╝╚══════╝╚═╝     ╚═╝     ╚═╝ ╚═════╝ 
                        `);
    console.log(
      colors.yellow(
        "Tool này được làm bởi Zepmo. Nếu bạn thấy hay thì hãy ủng hộ mình 1 subscribe nhé!"
      )
    );
    console.log(colors.blue("Contact Telegram: @zepmoairdrop \n"));
  }

  async login(data, index) {
    const url = "https://backend.babydogepawsbot.com/authorize";
    const header = { ...this.headers };
    const payload = data;
    try {
      const res = await axios.post(url, payload, {
        headers: header
      });
      if (res?.data) {
        const { balance, energy, max_energy, access_token, league } = res.data;
        const points_per_tap = league.points_per_tap;
        this.log(
          `[Account ${index}] Balance: ${balance} | Energy: ${energy}/${max_energy} | Points/Tap: ${points_per_tap}`
            .green
        );
        return { access_token, energy, points_per_tap };
      } else {
        this.log("Đăng nhập thất bại!".red);
        return null;
      }
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`.red);
      return null;
    }
  }

  async daily(token, index) {
    const checkUrl = "https://backend.babydogepawsbot.com/getDailyBonuses";
    const claimUrl = "https://backend.babydogepawsbot.com/pickDailyBonus";
    const headers = { ...this.headers, "X-Api-Key": token };

    try {
      const checkRes = await axios.get(checkUrl, {
        headers,
      });
      if (checkRes?.data && checkRes?.data.has_available) {
        // this.log(`[Account ${index}] Điểm danh hàng ngày có sẵn!`.yellow);
        const claimRes = await axios.post(
          claimUrl,
          {},
          {
            headers,
          }
        );
        if (claimRes?.data) {
          this.log(`[Account ${index}] Check-in daily successful!`.green);
        } else {
          this.log(`[Account ${index}] Check-in daily error!`.red);
        }
      } else {
        this.log(`[Account ${index}] Already check-in today!`.yellow);
      }
    } catch (error) {
      this.log(`[Account ${index}] Error check-in daily: ${error.message}`.red);
    }
  }

  async getTask(access_token, index) {
    const url = "https://backend.babydogepawsbot.com/channels";
    const headers = { ...this.headers, "X-Api-Key": access_token };

    try {
      const res = await axios.get(url, {
        headers,
      });
      if (res?.data?.channels) {
        const availableChannels = res.data.channels.filter(
          (channel) => channel.type !== "telegram"
        );
        // console.log(res.data.channels);
        return availableChannels;
      } else {
        this.log(`[Account ${index}] Error get task!`.yellow);
        return [];
      }
    } catch (error) {
      this.log(`[Account ${index}] Error get task: ${error.message}`.red);
      return [];
    }
  }

  async resolveTask(token, channel, index) {
    const url = "https://backend.babydogepawsbot.com/channels-resolve";
    const header = {
      ...this.headers,
      "X-Api-Key": token,
      "Content-Type": "application/json",
    };
    const data = JSON.stringify({
      channel_id: channel.id,
    });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: header,
        body: data,
      });
      const json = await res.json();
      if (json?.reward) {
        this.log(
          `[Account ${index}] Task: ${channel?.title} > Resolved!`.green
        );
        await this.sleep(1000);
        await this.claimTask(token, channel, index);
      } else {
        this.log(`[Account ${index}] Task: ${channel?.title} > Error!`.red);
      }
    } catch (error) {
      this.log(
        `[Account ${index}] Task: ${channel?.title} > Error: ${error.message}`
          .red
      );
    }
  }

  async claimTask(token, channel, index) {
    const url = "https://backend.babydogepawsbot.com/channels";
    const header = {
      ...this.headers,
      "X-Api-Key": token,
      "Content-Type": "application/json",
    };
    const data = JSON.stringify({
      channel_id: channel.id,
    });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: header,
        body: data,
      });
      const json = await res.json();
      if (json?.reward) {
        this.log(
          `[Account ${index}] Task: ${channel?.title} > Done! Reward: ${json.reward}`
            .green
        );
      } else {
        if (json?.message) {
          this.log(
            `[Account ${index}] Task: ${channel?.title} > ${json.message}`
              .yellow
          );
        } else {
          this.log(`[Account ${index}] Task: ${channel?.title} > Error!`.red);
        }
      }
    } catch (error) {
      this.log(
        `[Account ${index}] Task: ${channel?.title} > Error: ${error.message}`
          .red
      );
    }
  }

  async tap(access_token, initialEnergy, points_per_tap, index) {
    const url = "https://backend.babydogepawsbot.com/mine";
    const headers = {
      ...this.headers,
      "X-Api-Key": access_token,
      "Content-Type": "application/json",
    };
    let energy = initialEnergy;
    try {
      while (energy >= 50) {
        const randomEnergy = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
        let count = Math.floor((energy - randomEnergy) / points_per_tap);

        if (count <= 0) {
          this.log(`[Account ${index}] Not enough energy!`.yellow);
          break;
        }

        const data = JSON.stringify({ count });

        const res = await axios.post(url, data, {
          headers,
        });
        if (res?.data) {
          const {
            balance,
            mined,
            newEnergy,
            league,
            current_league,
            next_league,
          } = res.data.mine;

          this.log(
            `[Account ${index}] (+) ${String(mined)} Taps | Balance: ${String(
              balance
            )} | Energy: ${String(newEnergy)}`.green
          );

          energy = newEnergy;

          if (energy < 50) {
            break;
          }
        } else {
          this.log(`[Account ${index}] Tap error!`.red);
          break;
        }
      }
    } catch (error) {
      this.log(`[Account ${index}] Tap error: ${error.message}`.red);
    }
  }

  async buyCards(access_token, index) {
    const listCardsUrl = "https://backend.babydogepawsbot.com/cards";
    const upgradeUrl = "https://backend.babydogepawsbot.com/cards";
    const getMeUrl = "https://backend.babydogepawsbot.com/getMe";
    const headers = {
      ...this.headers,
      "X-Api-Key": access_token,
      "Content-Type": "application/json",
    };

    try {
      const getMeRes = await axios.get(getMeUrl, {
        headers,
      });
      let balance = getMeRes.data.balance;

      const res = await axios.get(listCardsUrl, {
        headers,
      });
      if (res?.data?.length > 0) {
        for (const category of res.data) {
          for (const card of category.cards) {
            if (balance < card.upgrade_cost) {
              this.log(
                `[Account ${index}] The balance is not enough to buy the card!`
                  .red
              );
              return;
            }

            if (card.cur_level === 0 && card.is_available) {
              const upgradeData = JSON.stringify({ id: card.id });
              const upgradeRes = await axios.post(upgradeUrl, upgradeData, {
                headers,
              });
              if (upgradeRes.data) {
                balance = upgradeRes.data.balance;
                this.log(
                  `[Account ${index}] Buy card: ${
                    card.name
                  } > Success! Balance: ${String(balance)}`.green
                );
              } else {
                this.log(
                  `[Account ${index}] Buy card: ${card.name} > Fail!`.red
                );
              }
            }
          }
        }
      } else {
        this.log(`[Account ${index}] There are no new cards!`.yellow);
      }
    } catch (error) {
      this.log(`Error while buy card: ${error.message}`.red);
    }
  }

  async upgradeMyCards(access_token, index) {
    const listCardsUrl = "https://backend.babydogepawsbot.com/cards";
    const upgradeUrl = "https://backend.babydogepawsbot.com/cards";
    const getMeUrl = "https://backend.babydogepawsbot.com/getMe";
    const headers = {
      ...this.headers,
      "X-Api-Key": access_token,
      "Content-Type": "application/json",
    };

    try {
      const getMeRes = await axios.get(getMeUrl, {
        headers,
      });
      let balance = getMeRes.data.balance;

      const res = await axios.get(listCardsUrl, {
        headers,
      });
      if (res?.data?.length > 0) {
        let allCards = res.data.flatMap((category) => category.cards);
        let upgradedThisCycle = new Set();

        while (true) {
          allCards.sort((a, b) => b.cur_total_farming - a.cur_total_farming);

          let upgradedAny = false;
          for (const card of allCards) {
            if (
              !upgradedThisCycle.has(card.id) &&
              balance >= card.upgrade_cost &&
              card.is_available
            ) {
              const upgradeData = JSON.stringify({ id: card.id });
              const upgradeRes = await axios.post(upgradeUrl, upgradeData, {
                headers,
              });
              if (upgradeRes?.data) {
                balance = upgradeRes.data.balance;
                this.log(
                  `[Account ${index}] Upgrade card: ${
                    card.name
                  } > Success! Balance: ${String(balance)}`.green
                );
                upgradedAny = true;
                upgradedThisCycle.add(card.id);
                card.cur_level += 1;
                card.upgrade_cost = upgradeRes.data.next_upgrade_cost;
                card.cur_total_farming = upgradeRes.data.cur_total_farming;
              } else {
                this.log(
                  `[Account ${index}] Upgrade card: ${card.name} > Fail!`
                );
              }
              break;
            } else if (card.upgrade_cost > balance) {
              this.log(
                `[Account ${index}] Upgrade card: ${card.name.yellow}: Not enough balance!`
                  .yellow
              );
            }
            this.sleep(1000);
          }
          if (!upgradedAny) {
            break;
          }
          if (upgradedThisCycle.size === allCards.length) {
            upgradedThisCycle.clear();
          }
        }
      } else {
        this.log(`[Account ${index}] There is no card to upgrade.`.yellow);
      }
    } catch (error) {
      this.log(`[Account ${index}] Upgrade card fail: ${error.message}`.red);
    }
  }

  async process(data, index) {
    const login = await this.login(data, index);
    if (login?.access_token) {
      await this.daily(login.access_token, index);
      if (config.is_do_task) {
        const tasks = await this.getTask(login.access_token, index);
        for (const task of tasks) {
          if (task?.is_resolved == false) {
            await this.resolveTask(login.access_token, task, index);
          } else if (
            task?.is_resolved == true &&
            task?.is_reward_taken == false
          ) {
            await this.claimTask(login.access_token, task, index);
          }
          this.sleep(1000);
        }
      }
      if (config.is_buy_card) {
        await this.buyCards(login.access_token, index);
      }
      if (config.is_upgrade_card) {
        await this.upgradeMyCards(login.access_token, index);
      }
      await this.tap(
        login?.access_token,
        login?.energy,
        login?.points_per_tap,
        index
      );
    }
  }

  async main() {
    await this.title();
    const dataFile = path.join(__dirname, "data.txt");
    const data = fs
      .readFileSync(dataFile, "utf8")
      .replace(/\r/g, "")
      .split("\n")
      .filter(Boolean);

    if (data.length <= 0) {
      this.log("No accounts added!".red);
      process.exit();
    }

    while (true) {
      const threads = [];
      for (const [index, tgData] of data.entries()) {
        threads.push(this.process(tgData, index + 1));
        if (threads.length >= config.threads) {
          console.log(`Running ${threads.length} threads process...`.bgYellow);
          await Promise.all(threads);
          threads.length = 0;
        }
      }
      if (threads.length > 0) {
        console.log(`Running ${threads.length} threads process...`.bgYellow);
        await Promise.all(threads);
      }
      await this.waitWithCountdown(config.wait_time);
    }
  }
}

if (require.main === module) {
  process.on("SIGINT", () => {
    process.exit();
  });
  new BabyDoge().main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

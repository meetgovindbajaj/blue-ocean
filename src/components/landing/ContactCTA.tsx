"use client";

import { motion } from "framer-motion";
import { Button, Form, Input, Row, Col, Card } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SendOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

const contactInfo = [
  {
    icon: <MailOutlined />,
    title: "Email Us",
    content: "info@blueoceanexport.com",
    subtitle: "We&apos;ll respond within 24 hours",
  },
  {
    icon: <PhoneOutlined />,
    title: "Call Us",
    content: "+1 (555) 123-4567",
    subtitle: "Mon-Fri 9AM-6PM EST",
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Visit Us",
    content: "123 Furniture Street, Wood City",
    subtitle: "Schedule an appointment",
  },
];

const socialLinks = [
  { icon: <FacebookOutlined />, name: "Facebook" },
  { icon: <TwitterOutlined />, name: "Twitter" },
  { icon: <InstagramOutlined />, name: "Instagram" },
  { icon: <LinkedinOutlined />, name: "LinkedIn" },
];

export default function ContactCTA() {
  const [form] = Form.useForm();

  const handleSubmit = (values: {
    name: string;
    email: string;
    message: string;
  }) => {
    console.log("Form submitted:", values);
    // Handle form submission here
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="contact-cta">
      <div className="container">
        <motion.div
          className="contact-cta__content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="contact-cta__header" variants={itemVariants}>
            <h2 className="contact-cta__title">Get In Touch</h2>
            <p className="contact-cta__subtitle">
              Ready to transform your space? Let&apos;s discuss your furniture
              needs
            </p>
          </motion.div>

          <Row gutter={[32, 32]} className="contact-cta__grid">
            <Col xs={24} lg={8}>
              <motion.div className="contact-info" variants={itemVariants}>
                <h3 className="contact-info__title">Contact Information</h3>
                <div className="contact-info__items">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="contact-info__item">
                      <div className="contact-info__icon">{info.icon}</div>
                      <div className="contact-info__details">
                        <h4 className="contact-info__item-title">
                          {info.title}
                        </h4>
                        <p className="contact-info__content">{info.content}</p>
                        <span className="contact-info__subtitle">
                          {info.subtitle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="contact-info__social">
                  <h4 className="contact-info__social-title">Follow Us</h4>
                  <div className="contact-info__social-links">
                    {socialLinks.map((social, index) => (
                      <Button
                        key={index}
                        type="text"
                        icon={social.icon}
                        className="contact-info__social-link"
                        aria-label={social.name}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </Col>

            <Col xs={24} lg={16}>
              <motion.div variants={itemVariants}>
                <Card className="contact-form-card" bordered={false}>
                  <h3 className="contact-form__title">Send us a Message</h3>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="contact-form"
                  >
                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="firstName"
                          label="First Name"
                          rules={[
                            {
                              required: true,
                              message: "Please enter your first name",
                            },
                          ]}
                        >
                          <Input placeholder="John" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="lastName"
                          label="Last Name"
                          rules={[
                            {
                              required: true,
                              message: "Please enter your last name",
                            },
                          ]}
                        >
                          <Input placeholder="Doe" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        {
                          type: "email",
                          message: "Please enter a valid email",
                        },
                      ]}
                    >
                      <Input placeholder="john.doe@example.com" />
                    </Form.Item>

                    <Form.Item name="phone" label="Phone Number">
                      <Input placeholder="+1 (555) 123-4567" />
                    </Form.Item>

                    <Form.Item
                      name="subject"
                      label="Subject"
                      rules={[
                        { required: true, message: "Please enter a subject" },
                      ]}
                    >
                      <Input placeholder="Inquiry about custom furniture" />
                    </Form.Item>

                    <Form.Item
                      name="message"
                      label="Message"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your message",
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder="Tell us about your furniture needs..."
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<SendOutlined />}
                        className="contact-form__submit"
                        block
                      >
                        Send Message
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </motion.div>
            </Col>
          </Row>

          <motion.div
            className="contact-cta__newsletter"
            variants={itemVariants}
          >
            <Card className="newsletter-card" bordered={false}>
              <Row align="middle" gutter={[24, 16]}>
                <Col xs={24} md={16}>
                  <h3 className="newsletter-card__title">
                    Stay Updated with Our Latest Collections
                  </h3>
                  <p className="newsletter-card__description">
                    Subscribe to our newsletter for exclusive offers and new
                    product announcements
                  </p>
                </Col>
                <Col xs={24} md={8}>
                  <div className="newsletter-card__form">
                    <Input.Group compact>
                      <Input
                        style={{ width: "calc(100% - 120px)" }}
                        placeholder="Enter your email"
                      />
                      <Button type="primary" style={{ width: "120px" }}>
                        Subscribe
                      </Button>
                    </Input.Group>
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
